export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface DictionaryTypeDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  systemDefined: boolean;
  active: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DictionaryTypeUpdateRequest {
  name: string;
  description: string | null;
  active: boolean;
}

export interface DictionaryEntryDto {
  id: string;
  typeId: string;
  typeCode: string;
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
  active: boolean;
  systemDefined: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DictionaryEntryCreateRequest {
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
  metadata: Record<string, unknown> | null;
}

export interface DictionaryEntryUpdateRequest {
  name: string;
  description: string | null;
  displayOrder: number;
  active: boolean;
  metadata: Record<string, unknown> | null;
}
