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

export interface ItSystemRef {
  id: string;
  code: string;
  name: string;
  icon: string | null;
}

export interface TransportLayerRef {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface DataDomainRef {
  id: string;
  code: string;
  name: string;
}

export interface ApiOwnerDto {
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

export interface ApiAttachmentDto {
  id: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  description: string | null;
  contractType: DictionaryEntryRef | null;
  createdAt: string;
  createdBy: string;
}

export interface ApiSummaryDto {
  id: string;
  code: string;
  name: string;
  apiVersion: string | null;
  type: DictionaryEntryRef | null;
  status: DictionaryEntryRef;
  sourceSystem: ItSystemRef | null;
  targetSystem: ItSystemRef | null;
  transportLayer: TransportLayerRef | null;
  tags: string[] | null;
  active: boolean;
}

export interface ApiDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  apiVersion: string | null;
  type: DictionaryEntryRef | null;
  status: DictionaryEntryRef;
  sourceSystem: ItSystemRef | null;
  targetSystem: ItSystemRef | null;
  transportLayer: TransportLayerRef | null;
  protocol: DictionaryEntryRef | null;
  authenticationMethod: DictionaryEntryRef | null;
  securityPolicy: DictionaryEntryRef | null;
  integrationPattern: DictionaryEntryRef | null;
  messageFormat: DictionaryEntryRef | null;
  slaResponseTimeMs: number | null;
  slaUptimePct: number | null;
  slaTier: DictionaryEntryRef | null;
  slaDescription: string | null;
  contractType: DictionaryEntryRef | null;
  contractUrl: string | null;
  documentationUrl: string | null;
  tags: string[] | null;
  dataDomains: DataDomainRef[];
  active: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ApiCreateRequest {
  code: string;
  name: string;
  description: string | null;
  apiVersion: string | null;
  typeId: string | null;
  statusId: string;
  sourceSystemId: string | null;
  targetSystemId: string | null;
  transportLayerId: string | null;
  protocolId: string | null;
  authenticationMethodId: string | null;
  securityPolicyId: string | null;
  integrationPatternId: string | null;
  messageFormatId: string | null;
  slaResponseTimeMs: number | null;
  slaUptimePct: number | null;
  slaTierId: string | null;
  slaDescription: string | null;
  contractTypeId: string | null;
  contractUrl: string | null;
  documentationUrl: string | null;
  tags: string[] | null;
  dataDomainIds: string[] | null;
}

export interface ApiUpdateRequest {
  name: string;
  description: string | null;
  apiVersion: string | null;
  typeId: string | null;
  statusId: string;
  sourceSystemId: string | null;
  targetSystemId: string | null;
  transportLayerId: string | null;
  protocolId: string | null;
  authenticationMethodId: string | null;
  securityPolicyId: string | null;
  integrationPatternId: string | null;
  messageFormatId: string | null;
  slaResponseTimeMs: number | null;
  slaUptimePct: number | null;
  slaTierId: string | null;
  slaDescription: string | null;
  contractTypeId: string | null;
  contractUrl: string | null;
  documentationUrl: string | null;
  tags: string[] | null;
  dataDomainIds: string[] | null;
}

export interface ApiOwnerCreateRequest {
  roleId: string;
  firstName: string;
  lastName: string;
  email: string;
  validFrom: string;
  validTo: string | null;
}

export interface ApiOwnerUpdateRequest {
  roleId: string;
  firstName: string;
  lastName: string;
  email: string;
  validFrom: string;
  validTo: string | null;
}

export interface ApiSearchParams {
  query?: string;
  statusId?: string;
  typeId?: string;
  transportLayerId?: string;
  active?: boolean;
  sourceSystemId?: string;
  targetSystemId?: string;
  tag?: string;
  page?: number;
  size?: number;
  sort?: string;
}
