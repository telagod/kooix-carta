export type AuditMode = "jsonl" | "sqlite" | "none";

export interface ServerOptions {
  root: string;
  readOnly: boolean;
  auditMode: AuditMode;
}

export interface ScanRequest {
  root?: string;
  include?: string[];
  exclude?: string[];
  autoGenerate?: boolean;
  generateOptions?: {
    template?: 'minimal' | 'detailed';
    inferFromPath?: boolean;
    inferFromContent?: boolean;
    dryRun?: boolean;
  };
}

export interface ScanCardInfo {
  exists: boolean;
  start?: number;
  end?: number;
  yaml?: string;
}

export interface EditBlockInfo {
  blockId: string;
  start: number;
  end: number;
  hash?: string;
}

export interface ScanFileEntry {
  path: string;
  sfc: ScanCardInfo;
  dfc: ScanCardInfo;
  editBlocks: EditBlockInfo[];
  sha256: string;
  generated?: {
    sfc?: boolean;
    dfc?: boolean;
  };
}

export interface ScanResponse {
  files: ScanFileEntry[];
  generated?: {
    count: number;
    files: string[];
    dryRun?: boolean;
  };
}

export interface CardDetail {
  yaml: string;
  start: number;
  end: number;
}

export interface GetCardsResponse {
  path: string;
  sfc?: CardDetail;
  dfc?: CardDetail;
  sha256: string;
}

export interface ApplyPatchRequest {
  file: string;
  blockId: string;
  oldHash: string;
  newContent: string;
  reason?: string;
}

export interface ApplyPatchResult {
  file: string;
  blockId: string;
  newHash: string;
  diff: string;
}

export interface AppendReadLogRequest {
  runId: string;
  path: string;
  sha256: string;
}
