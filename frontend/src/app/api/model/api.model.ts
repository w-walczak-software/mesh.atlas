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
  producerSystem: ItSystemRef | null;
  consumerSystems: ItSystemRef[];
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
  producerSystem: ItSystemRef | null;
  dataFlowDirection: DictionaryEntryRef | null;
  consumerSystems: ItSystemRef[];
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
  environments: DictionaryEntryRef[];
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
  producerSystemId: string | null;
  dataFlowDirectionId: string | null;
  consumerSystemIds: string[] | null;
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
  environmentIds: string[] | null;
}

export interface ApiUpdateRequest {
  name: string;
  description: string | null;
  apiVersion: string | null;
  typeId: string | null;
  statusId: string;
  producerSystemId: string | null;
  dataFlowDirectionId: string | null;
  consumerSystemIds: string[] | null;
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
  environmentIds: string[] | null;
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

export interface ApiOwnerHistoryDto {
  revisionNumber: number;
  revisionType: string;
  revisionTimestamp: string;
  username: string | null;
  userId: string | null;
  ownerId: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string | null;
  validFrom: string | null;
  validTo: string | null;
}

export interface ApiAttachmentHistoryDto {
  revisionNumber: number;
  revisionType: string;
  revisionTimestamp: string;
  username: string | null;
  userId: string | null;
  fileName: string;
  description: string | null;
  contractTypeId: string | null;
  contractTypeName: string | null;
}

export interface ApiConsumerSystemHistoryDto {
  revisionNumber: number;
  revisionType: string;
  revisionTimestamp: string;
  username: string | null;
  userId: string | null;
  systemId: string;
  systemCode: string | null;
  systemName: string | null;
  systemIcon: string | null;
}

export interface ApiSearchParams {
  query?: string;
  statusId?: string;
  typeId?: string;
  transportLayerId?: string;
  active?: boolean;
  producerSystemId?: string;
  consumerSystemId?: string;
  tag?: string;
  environmentId?: string;
  page?: number;
  size?: number;
  sort?: string;
}
