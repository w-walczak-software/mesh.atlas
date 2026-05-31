export interface WsdlModel {
  name: string;
  targetNamespace: string;
  version: '1.1' | '2.0' | 'unknown';
  services: WsdlService[];
  portTypes: WsdlPortType[];
  bindings: WsdlBinding[];
}

export interface WsdlService {
  name: string;
  ports: WsdlPort[];
}

export interface WsdlPort {
  name: string;
  binding: string;
  address: string;
  protocol: 'SOAP 1.1' | 'SOAP 1.2' | 'HTTP' | 'Other';
}

export interface WsdlPortType {
  name: string;
  documentation: string;
  operations: WsdlOperation[];
}

export interface WsdlOperation {
  name: string;
  documentation: string;
  soapAction: string;
  style: string;
  input: WsdlOpIO | null;
  output: WsdlOpIO | null;
  faults: WsdlFault[];
}

export interface WsdlOpIO {
  messageName: string;
  parts: WsdlPart[];
}

export interface WsdlFault {
  name: string;
  messageName: string;
}

export interface WsdlPart {
  name: string;
  ref: string;
  refKind: 'element' | 'type';
  fields: WsdlField[];
}

export interface WsdlBinding {
  name: string;
  portTypeName: string;
  protocol: 'SOAP 1.1' | 'SOAP 1.2' | 'HTTP' | 'Other';
  style: string;
  transport: string;
}

export interface WsdlField {
  name: string;
  type: string;
  minOccurs: string;
  maxOccurs: string;
  nillable: boolean;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

const SOAP_NS   = 'http://schemas.xmlsoap.org/wsdl/soap/';
const SOAP12_NS = 'http://schemas.xmlsoap.org/wsdl/soap12/';

function kids(parent: Element, local: string): Element[] {
  return [...parent.children].filter(el => el.localName === local);
}

function deepFind(root: Element, local: string): Element | null {
  for (const child of root.children) {
    if (child.localName === local) return child;
    const found = deepFind(child, local);
    if (found) return found;
  }
  return null;
}

function stripNs(ref: string | null | undefined): string {
  if (!ref) return '';
  const i = ref.indexOf(':');
  return i >= 0 ? ref.slice(i + 1) : ref;
}

function stripCommonPrefixes(type: string): string {
  return type.replace(/^(xs|xsd|xsi|tns|impl|ns\d*):/, '');
}

function docText(el: Element): string {
  return [...el.children].find(c => c.localName === 'documentation')
    ?.textContent?.trim() ?? '';
}

function soapKid(parent: Element, local: string): Element | undefined {
  return [...parent.children].find(
    c => c.localName === local &&
        (c.namespaceURI === SOAP_NS || c.namespaceURI === SOAP12_NS),
  );
}

// ── XSD schema parsing ────────────────────────────────────────────────────────

function extractFields(ctEl: Element): WsdlField[] {
  const container = deepFind(ctEl, 'sequence')
    ?? deepFind(ctEl, 'all')
    ?? deepFind(ctEl, 'choice');
  if (!container) return [];

  return kids(container, 'element').map(el => ({
    name:      el.getAttribute('name') ?? stripNs(el.getAttribute('ref')),
    type:      stripCommonPrefixes(el.getAttribute('type') ?? 'any'),
    minOccurs: el.getAttribute('minOccurs') ?? '1',
    maxOccurs: el.getAttribute('maxOccurs') ?? '1',
    nillable:  el.getAttribute('nillable') === 'true',
  })).filter(f => f.name);
}

function parseSchemas(root: Element): {
  elements: Map<string, WsdlField[]>;
  complexTypes: Map<string, WsdlField[]>;
} {
  const elements    = new Map<string, WsdlField[]>();
  const complexTypes = new Map<string, WsdlField[]>();

  for (const typesEl of kids(root, 'types')) {
    // Walk all descendant <schema> elements
    const walk = (el: Element) => {
      for (const child of el.children) {
        if (child.localName === 'schema') {
          for (const ct of kids(child, 'complexType')) {
            const n = ct.getAttribute('name');
            if (n) complexTypes.set(n, extractFields(ct));
          }
          for (const elem of kids(child, 'element')) {
            const n = elem.getAttribute('name');
            if (!n) continue;
            const inline = kids(elem, 'complexType')[0];
            if (inline) {
              elements.set(n, extractFields(inline));
            } else {
              const typeRef = stripNs(elem.getAttribute('type'));
              elements.set(n, complexTypes.get(typeRef) ?? []);
            }
          }
        }
        walk(child);
      }
    };
    walk(typesEl);
  }

  // Second pass: resolve element→complexType references that were forward-declared
  for (const [n, fields] of elements) {
    if (fields.length === 0) {
      const typeRef = n; // best-effort: try same name as complexType
      const resolved = complexTypes.get(typeRef);
      if (resolved?.length) elements.set(n, resolved);
    }
  }

  return { elements, complexTypes };
}

// ── Binding op map ────────────────────────────────────────────────────────────

function bindingOpMap(root: Element): Map<string, Map<string, { soapAction: string; style: string }>> {
  const result = new Map<string, Map<string, { soapAction: string; style: string }>>();

  for (const bEl of kids(root, 'binding')) {
    const bName       = bEl.getAttribute('name') ?? '';
    const soapBinding = soapKid(bEl, 'binding');
    const defStyle    = soapBinding?.getAttribute('style') ?? 'document';
    const opMap       = new Map<string, { soapAction: string; style: string }>();

    for (const opEl of kids(bEl, 'operation')) {
      const soapOp = soapKid(opEl, 'operation');
      opMap.set(opEl.getAttribute('name') ?? '', {
        soapAction: soapOp?.getAttribute('soapAction') ?? '',
        style:      soapOp?.getAttribute('style') ?? defStyle,
      });
    }
    result.set(bName, opMap);
  }
  return result;
}

// ── Messages ──────────────────────────────────────────────────────────────────

function parseMessages(
  root: Element,
  elements: Map<string, WsdlField[]>,
  complexTypes: Map<string, WsdlField[]>,
): Map<string, WsdlPart[]> {
  const result = new Map<string, WsdlPart[]>();

  for (const msgEl of kids(root, 'message')) {
    const name  = msgEl.getAttribute('name') ?? '';
    const parts = kids(msgEl, 'part').map(pEl => {
      const elemRef = stripNs(pEl.getAttribute('element'));
      const typeRef = stripNs(pEl.getAttribute('type'));
      const ref     = elemRef || typeRef;
      let fields: WsdlField[] = [];
      if (elemRef) fields = elements.get(elemRef) ?? [];
      if (!fields.length && typeRef) fields = complexTypes.get(typeRef) ?? [];
      return {
        name:    pEl.getAttribute('name') ?? '',
        ref:     stripCommonPrefixes(ref),
        refKind: (elemRef ? 'element' : 'type') as 'element' | 'type',
        fields,
      };
    });
    result.set(name, parts);
  }
  return result;
}

// ── PortTypes ─────────────────────────────────────────────────────────────────

function parsePortTypes(
  root: Element,
  messages: Map<string, WsdlPart[]>,
  bOpMap: Map<string, Map<string, { soapAction: string; style: string }>>,
): WsdlPortType[] {
  return kids(root, 'portType').map(ptEl => {
    const ptName = ptEl.getAttribute('name') ?? '';

    // Find the binding that references this portType
    let opInfoMap: Map<string, { soapAction: string; style: string }> | null = null;
    for (const bEl of kids(root, 'binding')) {
      if (stripNs(bEl.getAttribute('type')) === ptName) {
        opInfoMap = bOpMap.get(bEl.getAttribute('name') ?? '') ?? null;
        break;
      }
    }

    const resolveIO = (ioEl: Element | null): WsdlOpIO | null => {
      if (!ioEl) return null;
      const msgName = stripNs(ioEl.getAttribute('message'));
      return { messageName: msgName, parts: messages.get(msgName) ?? [] };
    };

    const operations = kids(ptEl, 'operation').map(opEl => {
      const opName = opEl.getAttribute('name') ?? '';
      const info   = opInfoMap?.get(opName);
      return {
        name:          opName,
        documentation: docText(opEl),
        soapAction:    info?.soapAction ?? '',
        style:         info?.style ?? 'document',
        input:         resolveIO(kids(opEl, 'input')[0] ?? null),
        output:        resolveIO(kids(opEl, 'output')[0] ?? null),
        faults:        kids(opEl, 'fault').map(fEl => ({
          name:        fEl.getAttribute('name') ?? '',
          messageName: stripNs(fEl.getAttribute('message')),
        })),
      };
    });

    return { name: ptName, documentation: docText(ptEl), operations };
  });
}

// ── Bindings & services ───────────────────────────────────────────────────────

function parseBindings(root: Element): WsdlBinding[] {
  return kids(root, 'binding').map(bEl => {
    const soapEl   = soapKid(bEl, 'binding');
    const protocol: WsdlBinding['protocol'] = !soapEl ? 'Other'
      : soapEl.namespaceURI === SOAP12_NS ? 'SOAP 1.2' : 'SOAP 1.1';
    return {
      name:         bEl.getAttribute('name') ?? '',
      portTypeName: stripNs(bEl.getAttribute('type')),
      protocol,
      style:        soapEl?.getAttribute('style') ?? 'document',
      transport:    soapEl?.getAttribute('transport') ?? '',
    };
  });
}

function parseServices(root: Element): WsdlService[] {
  return kids(root, 'service').map(svcEl => ({
    name: svcEl.getAttribute('name') ?? '',
    ports: kids(svcEl, 'port').map(portEl => {
      const addrEl   = [...portEl.children].find(c => c.localName === 'address');
      const protocol: WsdlPort['protocol'] = !addrEl ? 'Other'
        : addrEl.namespaceURI === SOAP12_NS ? 'SOAP 1.2'
        : addrEl.namespaceURI === SOAP_NS   ? 'SOAP 1.1'
        : 'HTTP';
      return {
        name:    portEl.getAttribute('name') ?? '',
        binding: stripNs(portEl.getAttribute('binding')),
        address: addrEl?.getAttribute('location') ?? '',
        protocol,
      };
    }),
  }));
}

// ── Public API ────────────────────────────────────────────────────────────────

export function parseWsdl(xmlText: string): WsdlModel {
  const doc  = new DOMParser().parseFromString(xmlText, 'text/xml');
  const root = doc.documentElement;

  if (root.localName === 'parsererror') throw new Error('Invalid XML');

  const ns = root.namespaceURI ?? '';
  const version: WsdlModel['version'] =
    ns === 'http://schemas.xmlsoap.org/wsdl/' ? '1.1' :
    ns === 'http://www.w3.org/ns/wsdl'        ? '2.0' : 'unknown';

  const { elements, complexTypes } = parseSchemas(root);
  const messages  = parseMessages(root, elements, complexTypes);
  const bOpMap    = bindingOpMap(root);
  const portTypes = parsePortTypes(root, messages, bOpMap);

  return {
    name:            root.getAttribute('name') ?? '',
    targetNamespace: root.getAttribute('targetNamespace') ?? '',
    version,
    services:        parseServices(root),
    portTypes,
    bindings:        parseBindings(root),
  };
}
