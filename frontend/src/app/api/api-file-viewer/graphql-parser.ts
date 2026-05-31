// ── Public types ──────────────────────────────────────────────────────────────

export interface GqlSchema {
  queryType: string;
  mutationType: string;
  subscriptionType: string;
  types: GqlObjectType[];
  interfaces: GqlObjectType[];
  inputs: GqlObjectType[];
  enums: GqlEnum[];
  scalars: string[];
  unions: GqlUnion[];
}

export interface GqlObjectType {
  name: string;
  description: string;
  implements: string[];
  fields: GqlField[];
}

export interface GqlField {
  name: string;
  description: string;
  type: string;
  args: GqlArg[];
  isDeprecated: boolean;
  deprecationReason: string;
}

export interface GqlArg {
  name: string;
  description: string;
  type: string;
  defaultValue: string;
}

export interface GqlEnum {
  name: string;
  description: string;
  values: GqlEnumValue[];
}

export interface GqlEnumValue {
  name: string;
  description: string;
  isDeprecated: boolean;
  deprecationReason: string;
}

export interface GqlUnion {
  name: string;
  description: string;
  members: string[];
}

// ── Lexer ─────────────────────────────────────────────────────────────────────

type TK =
  | 'NAME' | 'STRING'
  | '{' | '}' | '(' | ')' | '[' | ']'
  | ':' | '!' | '=' | '|' | '&' | '@'
  | 'EOF';

interface Token { type: TK; value: string; }

class Lexer {
  private pos = 0;

  constructor(private readonly src: string) {}

  next(): Token {
    this.skip();
    if (this.pos >= this.src.length) return { type: 'EOF', value: '' };

    const ch = this.src[this.pos];

    if (ch === '"') {
      return this.src.startsWith('"""', this.pos) ? this.tripleStr() : this.singleStr();
    }

    const singles: Partial<Record<string, TK>> = {
      '{': '{', '}': '}', '(': '(', ')': ')', '[': '[', ']': ']',
      ':': ':', '!': '!', '=': '=', '|': '|', '&': '&', '@': '@',
    };
    const tk = singles[ch];
    if (tk) { this.pos++; return { type: tk, value: ch }; }

    if (/[A-Za-z_]/.test(ch)) return this.name();

    this.pos++;
    return this.next(); // skip unknown char (e.g. BOM, invalid utf)
  }

  peek(): Token {
    const saved = this.pos;
    const tok   = this.next();
    this.pos    = saved;
    return tok;
  }

  private skip() {
    while (this.pos < this.src.length) {
      const c = this.src[this.pos];
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === ',') {
        this.pos++;
      } else if (c === '#') {
        while (this.pos < this.src.length && this.src[this.pos] !== '\n') this.pos++;
      } else {
        break;
      }
    }
  }

  private name(): Token {
    const s = this.pos;
    while (this.pos < this.src.length && /[A-Za-z0-9_]/.test(this.src[this.pos])) this.pos++;
    return { type: 'NAME', value: this.src.slice(s, this.pos) };
  }

  private tripleStr(): Token {
    this.pos += 3;
    const s = this.pos;
    while (this.pos < this.src.length) {
      if (this.src.startsWith('"""', this.pos)) {
        const v = dedentBlockString(this.src.slice(s, this.pos));
        this.pos += 3;
        return { type: 'STRING', value: v };
      }
      this.pos++;
    }
    return { type: 'STRING', value: this.src.slice(s) };
  }

  private singleStr(): Token {
    this.pos++;
    let v = '';
    while (this.pos < this.src.length && this.src[this.pos] !== '"') {
      if (this.src[this.pos] === '\\') this.pos++;
      v += this.src[this.pos++];
    }
    this.pos++;
    return { type: 'STRING', value: v };
  }
}

function dedentBlockString(raw: string): string {
  const lines = raw.split('\n').map(l => l.trimEnd());
  let min = Infinity;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const leading = lines[i].length - lines[i].trimStart().length;
      if (leading < min) min = leading;
    }
  }
  if (!isFinite(min)) min = 0;
  const out = lines.map((l, i) => (i === 0 ? l.trim() : l.slice(min)));
  while (out.length && out[0] === '') out.shift();
  while (out.length && out[out.length - 1] === '') out.pop();
  return out.join('\n');
}

// ── Parser ────────────────────────────────────────────────────────────────────

class Parser {
  private readonly lex: Lexer;
  private buf: Token | null = null;

  constructor(src: string) {
    this.lex = new Lexer(src);
  }

  private next(): Token {
    if (this.buf) { const t = this.buf; this.buf = null; return t; }
    return this.lex.next();
  }

  private peek(): Token {
    if (!this.buf) this.buf = this.lex.next();
    return this.buf;
  }

  private eat(type: TK): boolean {
    if (this.peek().type === type) { this.next(); return true; }
    return false;
  }

  private expect(type: TK): Token {
    const t = this.next();
    if (t.type !== type) throw new Error(`Expected ${type}, got ${t.type}`);
    return t;
  }

  private name(): string {
    return this.peek().type === 'NAME' ? this.next().value : '';
  }

  // Skip a brace block without parsing it
  private skipBlock() {
    if (this.peek().type !== '{') return;
    this.next();
    let depth = 1;
    while (depth > 0) {
      const t = this.next();
      if (t.type === '{') depth++;
      else if (t.type === '}') depth--;
      else if (t.type === 'EOF') break;
    }
  }

  // TypeRef: [T!]!  /  T!  /  T
  private typeRef(): string {
    if (this.peek().type === '[') {
      this.next();
      const inner = this.typeRef();
      this.eat(']');
      return `[${inner}]${this.eat('!') ? '!' : ''}`;
    }
    const n = this.expect('NAME').value;
    return `${n}${this.eat('!') ? '!' : ''}`;
  }

  // @dir @dir(key: val, ...)  — returns deprecated metadata
  private directives(): { isDeprecated: boolean; reason: string } {
    let isDeprecated = false;
    let reason = '';
    while (this.peek().type === '@') {
      this.next();
      const nm = this.name();
      if (this.peek().type === '(') {
        this.next();
        while (this.peek().type !== ')' && this.peek().type !== 'EOF') {
          const key = this.name();
          this.eat(':');
          const val = this.next().value;
          if (nm === 'deprecated' && key === 'reason') reason = val;
        }
        this.eat(')');
      }
      if (nm === 'deprecated') isDeprecated = true;
    }
    return { isDeprecated, reason };
  }

  // (argName: TypeRef = default, ...)
  private args(): GqlArg[] {
    if (this.peek().type !== '(') return [];
    this.next();
    const result: GqlArg[] = [];
    while (this.peek().type !== ')' && this.peek().type !== 'EOF') {
      let desc = '';
      if (this.peek().type === 'STRING') desc = this.next().value;
      const nm = this.name();
      if (!nm) { this.next(); continue; }
      this.eat(':');
      const type = this.typeRef();
      let def = '';
      if (this.eat('=')) {
        if (this.peek().type === '{') { this.skipBlock(); def = '{...}'; }
        else if (this.peek().type === '[') {
          this.next();
          while (this.peek().type !== ']' && this.peek().type !== 'EOF') this.next();
          this.eat(']');
          def = '[...]';
        } else {
          def = this.next().value;
        }
      }
      this.directives(); // consume any directives on args
      result.push({ name: nm, description: desc, type, defaultValue: def });
    }
    this.eat(')');
    return result;
  }

  // { field: Type, ... }
  private fields(isInput: boolean): GqlField[] {
    this.expect('{');
    const result: GqlField[] = [];
    while (this.peek().type !== '}' && this.peek().type !== 'EOF') {
      let desc = '';
      if (this.peek().type === 'STRING') desc = this.next().value;
      if (this.peek().type === '}') break;
      const nm = this.name();
      if (!nm) { this.next(); continue; }
      const fieldArgs = isInput ? [] : this.args();
      this.eat(':');
      const type = this.typeRef();
      const dir  = this.directives();
      result.push({ name: nm, description: desc, type, args: fieldArgs, isDeprecated: dir.isDeprecated, deprecationReason: dir.reason });
    }
    this.eat('}');
    return result;
  }

  // implements A & B
  private implements(): string[] {
    if (this.peek().value !== 'implements') return [];
    this.next();
    this.eat('&');
    const ifaces = [this.expect('NAME').value];
    while (this.eat('&')) ifaces.push(this.expect('NAME').value);
    return ifaces;
  }

  parse(): GqlSchema {
    const schema: GqlSchema = {
      queryType: 'Query',
      mutationType: 'Mutation',
      subscriptionType: 'Subscription',
      types: [], interfaces: [], inputs: [], enums: [], scalars: [], unions: [],
    };

    const extFields = new Map<'types' | 'interfaces' | 'inputs', Map<string, GqlField[]>>([
      ['types', new Map()], ['interfaces', new Map()], ['inputs', new Map()],
    ]);

    while (true) {
      let desc = '';
      if (this.peek().type === 'STRING') desc = this.next().value;
      if (this.peek().type === 'EOF') break;
      if (this.peek().type !== 'NAME') { this.next(); continue; }

      const kw     = this.next().value;
      const extend = kw === 'extend';
      const word   = extend ? (this.peek().type === 'NAME' ? this.next().value : '') : kw;

      if (word === 'schema') {
        if (this.peek().type !== '{') continue;
        this.next();
        while (this.peek().type !== '}' && this.peek().type !== 'EOF') {
          const k = this.name(); this.eat(':'); const v = this.name();
          if (k === 'query')        schema.queryType        = v;
          if (k === 'mutation')     schema.mutationType     = v;
          if (k === 'subscription') schema.subscriptionType = v;
        }
        this.eat('}');
      } else if (word === 'type') {
        const nm    = this.name();
        if (!nm) { this.skipBlock(); continue; }
        const impls = this.implements();
        const flds  = this.fields(false);
        if (extend) { const m = extFields.get('types')!; m.set(nm, [...(m.get(nm) ?? []), ...flds]); }
        else schema.types.push({ name: nm, description: desc, implements: impls, fields: flds });
      } else if (word === 'interface') {
        const nm    = this.name();
        if (!nm) { this.skipBlock(); continue; }
        const impls = this.implements();
        const flds  = this.fields(false);
        if (extend) { const m = extFields.get('interfaces')!; m.set(nm, [...(m.get(nm) ?? []), ...flds]); }
        else schema.interfaces.push({ name: nm, description: desc, implements: impls, fields: flds });
      } else if (word === 'input') {
        const nm   = this.name();
        if (!nm) { this.skipBlock(); continue; }
        const flds = this.fields(true);
        if (extend) { const m = extFields.get('inputs')!; m.set(nm, [...(m.get(nm) ?? []), ...flds]); }
        else schema.inputs.push({ name: nm, description: desc, implements: [], fields: flds });
      } else if (word === 'enum') {
        const nm = this.name();
        if (!nm) { this.skipBlock(); continue; }
        this.directives();
        this.expect('{');
        const vals: GqlEnumValue[] = [];
        while (this.peek().type !== '}' && this.peek().type !== 'EOF') {
          let evDesc = '';
          if (this.peek().type === 'STRING') evDesc = this.next().value;
          if (this.peek().type === '}') break;
          const evNm = this.name();
          if (!evNm) { this.next(); continue; }
          const d = this.directives();
          vals.push({ name: evNm, description: evDesc, isDeprecated: d.isDeprecated, deprecationReason: d.reason });
        }
        this.eat('}');
        schema.enums.push({ name: nm, description: desc, values: vals });
      } else if (word === 'scalar') {
        const nm = this.name();
        if (nm) { this.directives(); schema.scalars.push(nm); }
      } else if (word === 'union') {
        const nm = this.name();
        if (!nm) continue;
        this.directives();
        this.eat('=');
        this.eat('|');
        const members = [this.name()];
        while (this.eat('|')) members.push(this.name());
        schema.unions.push({ name: nm, description: desc, members: members.filter(Boolean) });
      } else if (word === 'directive') {
        // skip @name(args) on LOCATIONS
        this.eat('@'); this.name();
        if (this.peek().type === '(') {
          this.next();
          let d = 1;
          while (d > 0) {
            const t = this.next();
            if (t.type === '(') d++; else if (t.type === ')') d--; else if (t.type === 'EOF') break;
          }
        }
        // consume 'on' keyword and location list
        while (this.peek().type === 'NAME' && !DEFINITION_KEYWORDS.has(this.peek().value)) this.next();
      } else if (this.peek().type === '{') {
        this.skipBlock();
      }
    }

    // Apply extend fields
    for (const [key, map] of extFields) {
      for (const [nm, flds] of map) {
        const arr = schema[key as 'types' | 'interfaces' | 'inputs'] as GqlObjectType[];
        const found = arr.find(t => t.name === nm);
        if (found) found.fields = [...found.fields, ...flds];
      }
    }

    return schema;
  }
}

const DEFINITION_KEYWORDS = new Set([
  'type', 'interface', 'input', 'enum', 'scalar', 'union', 'directive', 'schema', 'extend',
]);

// ── Public API ────────────────────────────────────────────────────────────────

export function parseGraphql(text: string): GqlSchema {
  return new Parser(text).parse();
}

export const BUILT_IN_SCALARS = new Set(['String', 'Int', 'Float', 'Boolean', 'ID']);
