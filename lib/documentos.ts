const MB = 1024 * 1024;

export const TAMANHO_LIMITE = {
  LIVRE: 2 * MB,
  MAXIMO: 10 * MB,
} as const;

const MIME_TYPES_PERMITIDOS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
] as const;

const EXTENSOES_PERMITIDAS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'] as const;

function getExtensao(nome: string): string {
  const i = nome.lastIndexOf('.');
  return i >= 0 ? nome.substring(i).toLowerCase() : '';
}

export function validarUploadCliente(
  file: File
): { valido: false; erro: string } | { valido: true; exigeJustificativa: boolean } {
  const ext = getExtensao(file.name);
  if (!EXTENSOES_PERMITIDAS.includes(ext as any)) {
    return { valido: false, erro: `Tipo de arquivo não permitido (${ext}). Permitidos: PDF, DOC, DOCX, XLS, XLSX, TXT.` };
  }
  if (!MIME_TYPES_PERMITIDOS.includes(file.type as any)) {
    if (file.type && file.type !== '') {
      return { valido: false, erro: `Tipo MIME não permitido: ${file.type}.` };
    }
  }
  if (file.size > TAMANHO_LIMITE.MAXIMO) {
    return { valido: false, erro: 'Arquivo muito grande. Máximo permitido: 10 MB.' };
  }
  if (file.size > TAMANHO_LIMITE.LIVRE) {
    return { valido: true, exigeJustificativa: true };
  }
  return { valido: true, exigeJustificativa: false };
}

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function gerarCodigoAcesso(): string {
  const ano = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `DOC-${ano}-${rand}`;
}

export function validarMimeTypeComExtensao(nome: string, mimeType: string): boolean {
  const ext = getExtensao(nome);
  const mapa: Record<string, string[]> = {
    '.pdf': ['application/pdf'],
    '.doc': ['application/msword'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    '.xls': ['application/vnd.ms-excel'],
    '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    '.txt': ['text/plain'],
  };
  const esperados = mapa[ext];
  if (!esperados) return false;
  if (!mimeType || mimeType === 'application/octet-stream') return true;
  return esperados.includes(mimeType);
}

export function getStoragePath(setorId: string, userId: string, extensao: string): string {
  const uuid = crypto.randomUUID();
  return `documentos/${setorId}/${uuid}${extensao}`;
}
