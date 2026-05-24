export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface DataDomainAttachmentDto {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  description: string | null;
  createdAt: string;
  createdBy: string;
}

export interface DataDomainSummaryDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  tags: string[] | null;
  active: boolean;
}

export interface DataDomainDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  documentationUrl: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  active: boolean;
  attachments: DataDomainAttachmentDto[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DataDomainCreateRequest {
  code: string;
  name: string;
  description: string | null;
  documentationUrl: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
}

export interface DataDomainUpdateRequest {
  name: string;
  description: string | null;
  documentationUrl: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
}

export interface DataDomainAttachmentHistoryDto {
  revisionNumber: number;
  revisionType: string;
  revisionTimestamp: string;
  username: string | null;
  userId: string | null;
  fileName: string;
  description: string | null;
}

export interface DataDomainSearchParams {
  query?: string;
  tag?: string;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
