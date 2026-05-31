export type DocViewerMode = 'openapi' | 'monaco' | 'none';

// These are opened via browser/OS download — no in-app preview
const OS_ONLY_EXTS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'odt', 'ods', 'odp', 'zip', 'rar', '7z', 'tar', 'gz', 'bz2',
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'tiff',
  'mp3', 'mp4', 'avi', 'mov', 'mkv', 'exe', 'msi', 'dmg',
]);

// File extensions that might be OpenAPI specs (need content-based detection)
const OPENAPI_CANDIDATE_EXTS = new Set(['json', 'yaml', 'yml']);

// Monaco language per extension
export const MONACO_LANGUAGES: Record<string, string> = {
  xml:        'xml',
  xsd:        'xml',
  wsdl:       'xml',
  xslt:       'xml',
  svg:        'xml',
  html:       'html',
  htm:        'html',
  css:        'css',
  scss:       'scss',
  less:       'less',
  csv:        'plaintext',
  tsv:        'plaintext',
  txt:        'plaintext',
  log:        'plaintext',
  md:         'markdown',
  ts:         'typescript',
  js:         'javascript',
  json:       'json',
  jsonld:     'json',
  yaml:       'yaml',
  yml:        'yaml',
  sql:        'sql',
  sh:         'shell',
  bash:       'shell',
  bat:        'bat',
  graphql:    'graphql',
  gql:        'graphql',
  proto:      'proto',
  properties: 'ini',
  ini:        'ini',
  toml:       'ini',
  dockerfile: 'dockerfile',
  diff:       'diff',
};

export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() ?? '';
}

/** Whether an in-app preview button should be shown for this file */
export function canPreview(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return !OS_ONLY_EXTS.has(ext) && (OPENAPI_CANDIDATE_EXTS.has(ext) || ext in MONACO_LANGUAGES);
}

/** Whether the file text looks like an AsyncAPI specification */
export function isAsyncApiContent(content: string): boolean {
  return content.includes('"asyncapi"') || /\basyncapi\s*:/m.test(content);
}

/** Whether the file text looks like an OpenAPI / Swagger specification */
export function isOpenApiContent(content: string): boolean {
  return (
    content.includes('"openapi"') ||
    content.includes('"swagger"') ||
    /\bopenapi\s*:/m.test(content) ||
    /\bswagger\s*:/m.test(content)
  );
}

/** Monaco language id for the given file */
export function getMonacoLanguage(fileName: string): string {
  const ext = getFileExtension(fileName);
  return MONACO_LANGUAGES[ext] ?? 'plaintext';
}

/** Pre-format content when possible (JSON pretty-print) */
export function prepareContent(text: string, fileName: string): string {
  const ext = getFileExtension(fileName);
  if (ext === 'json') {
    try { return JSON.stringify(JSON.parse(text), null, 2); } catch { /* return raw */ }
  }
  return text;
}
