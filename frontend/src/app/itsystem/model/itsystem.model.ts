export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface DictionaryEntryRef {
  id: string;
  code: string;
  name: string;
}

export interface ItSystemSummaryDto {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  status: DictionaryEntryRef;
  lifecycleStage: DictionaryEntryRef;
  businessCriticality: DictionaryEntryRef;
  systemType: DictionaryEntryRef;
  active: boolean;
}

export interface ItSystemOwnerDto {
  id: string;
  role: DictionaryEntryRef;
  firstName: string;
  lastName: string;
  email: string;
  validFrom: string;
  validTo: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ItSystemDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  documentationUrl: string | null;
  repositoryUrl: string | null;
  status: DictionaryEntryRef;
  lifecycleStage: DictionaryEntryRef;
  businessCriticality: DictionaryEntryRef;
  dataClassification: DictionaryEntryRef;
  systemType: DictionaryEntryRef;
  architectureStyle: DictionaryEntryRef | null;
  deploymentModel: DictionaryEntryRef | null;
  runtimeEnvironment: DictionaryEntryRef | null;
  scope: DictionaryEntryRef | null;
  owners: ItSystemOwnerDto[];
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  icon: string | null;
  externalId: string | null;
  active: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ItSystemCreateRequest {
  code: string;
  name: string;
  description: string | null;
  documentationUrl: string | null;
  repositoryUrl: string | null;
  statusId: string;
  lifecycleStageId: string;
  businessCriticalityId: string;
  dataClassificationId: string;
  systemTypeId: string;
  architectureStyleId: string | null;
  deploymentModelId: string | null;
  runtimeEnvironmentId: string | null;
  scopeId: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  icon: string | null;
  externalId: string | null;
  owners: ItSystemOwnerCreateRequest[] | null;
}

export interface ItSystemUpdateRequest {
  name: string;
  description: string | null;
  documentationUrl: string | null;
  repositoryUrl: string | null;
  statusId: string;
  lifecycleStageId: string;
  businessCriticalityId: string;
  dataClassificationId: string;
  systemTypeId: string;
  architectureStyleId: string | null;
  deploymentModelId: string | null;
  runtimeEnvironmentId: string | null;
  scopeId: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  icon: string | null;
  externalId: string | null;
}

export interface ItSystemOwnerCreateRequest {
  roleId: string;
  firstName: string;
  lastName: string;
  email: string;
  validFrom: string;
  validTo: string | null;
}

export interface ItSystemOwnerUpdateRequest {
  roleId: string;
  firstName: string;
  lastName: string;
  email: string;
  validFrom: string;
  validTo: string | null;
}

export interface ItSystemStatsDto {
  total: number;
  addedLastMonth: number;
}

export interface ItSystemSearchParams {
  query?: string;
  statusId?: string;
  lifecycleStageId?: string;
  businessCriticalityId?: string;
  systemTypeId?: string;
  active?: boolean;
  ownerQuery?: string;
  tag?: string;
  page?: number;
  size?: number;
  sort?: string;
}
