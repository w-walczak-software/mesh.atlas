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
  metadata: Record<string, unknown> | null;
}

export interface ApiMessagingEndpointDto {
  id: string;
  name: string;
  endpointType: DictionaryEntryRef | null;
  direction: DictionaryEntryRef | null;
  messageFormat: DictionaryEntryRef | null;
  description: string | null;
  displayOrder: number;
  active: boolean;
  createdAt: string;
  createdBy: string;
}

export interface ApiMessagingEndpointCreateRequest {
  name: string;
  endpointTypeId: string | null;
  directionId: string | null;
  messageFormatId: string | null;
  description: string | null;
  displayOrder: number;
}

export interface ApiMessagingEndpointUpdateRequest {
  name: string;
  endpointTypeId: string | null;
  directionId: string | null;
  messageFormatId: string | null;
  description: string | null;
  displayOrder: number;
}

export interface DataDomainRef {
  id: string;
  code: string;
  name: string;
}

export interface ApiEnvironmentDto {
  environment: DictionaryEntryRef;
  serviceUrl: string | null;
}

export interface ApiEnvironmentRequest {
  environmentId: string;
  serviceUrl: string | null;
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
  attachmentVersion: string | null;
  attachmentStatus: DictionaryEntryRef | null;
  createdAt: string;
  createdBy: string;
}

export type RaterType = 'INTERNAL_USER' | 'DEVELOPER_PORTAL';

export interface ApiRatingDto {
  id: string;
  score: number;
  raterId: string;
  raterType: RaterType;
  createdAt: string;
  updatedAt: string | null;
}

export interface ApiRatingSummaryDto {
  ratingCount: number;
  averageRating: number;
  weightedScore: number;
  distribution: Partial<Record<string, number>>;
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
  governanceStatus: GovernanceStatus;
  canEdit: boolean;
  canVerify: boolean;
  ratingsSummary: ApiRatingSummaryDto | null;
}

export type GovernanceStatus = 'PENDING_VERIFICATION' | 'VERIFIED' | 'REQUIRES_MODIFICATION' | 'PENDING_REVIEW';

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
  contractVersion: string | null;
  contractUrl: string | null;
  documentationUrl: string | null;
  tags: string[] | null;
  dataDomains: DataDomainRef[];
  environments: ApiEnvironmentDto[];
  externalId: string | null;
  source: string | null;
  active: boolean;
  governanceStatus: GovernanceStatus;
  governanceNote: string | null;
  canVerify: boolean;
  canEdit: boolean;
  canChangeProducerSystem: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  ratingsSummary: ApiRatingSummaryDto | null;
}

export interface ApiCreateRequest {
  code: string | null;
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
  contractVersion: string | null;
  contractUrl: string | null;
  documentationUrl: string | null;
  tags: string[] | null;
  dataDomainIds: string[] | null;
  environments: ApiEnvironmentRequest[] | null;
  externalId: string | null;
  owners: ApiOwnerCreateRequest[] | null;
  messagingEndpoints: ApiMessagingEndpointCreateRequest[] | null;
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
  contractVersion: string | null;
  contractUrl: string | null;
  documentationUrl: string | null;
  tags: string[] | null;
  dataDomainIds: string[] | null;
  environments: ApiEnvironmentRequest[] | null;
  externalId: string | null;
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
  attachmentVersion: string | null;
  attachmentStatusId: string | null;
  attachmentStatusName: string | null;
}

export interface ApiEnvironmentHistoryDto {
  revisionNumber: number;
  revisionType: string;
  revisionTimestamp: string;
  username: string | null;
  userId: string | null;
  environmentCode: string | null;
  environmentName: string | null;
  serviceUrl: string | null;
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
  producerSystemIds?: string[];
  consumerSystemIds?: string[];
  tag?: string;
  environmentId?: string;
  description?: string;
  integrationPatternId?: string;
  dataDomainIds?: string[];
  page?: number;
  size?: number;
  sort?: string;
  pendingVerificationOnly?: boolean;
  attachmentContent?: string;
  ownerName?: string;
}

export interface ApiVerifyRequest {
  note: string | null;
}

export interface ApiGovernancePendingCountDto {
  count: number;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export interface ApiStatsDto {
  total: number;
  active: number;
  inactive: number;
  deprecated: number;
  addedLastMonth: number;
  withSla: number;
  withDocumentation: number;
  withVersion: number;
  withDataDomain: number;
}

// ── Graph ──────────────────────────────────────────────────────────────────────

export interface ApiGraphSystemOwnerRef {
  firstName: string;
  lastName: string;
  email: string;
  roleName: string | null;
}

export interface ApiGraphSystemDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  status: DictionaryEntryRef | null;
  systemType: DictionaryEntryRef | null;
  lifecycleStage: DictionaryEntryRef | null;
  businessCriticality: DictionaryEntryRef | null;
  dataClassification: DictionaryEntryRef | null;
  architectureStyle: DictionaryEntryRef | null;
  active: boolean;
  tags: string[] | null;
  owners: ApiGraphSystemOwnerRef[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ApiGraphEdgeDto {
  id: string;
  code: string;
  name: string;
  apiVersion: string | null;
  type: DictionaryEntryRef | null;
  status: DictionaryEntryRef;
  transportLayer: TransportLayerRef | null;
  protocol: DictionaryEntryRef | null;
  authenticationMethod: DictionaryEntryRef | null;
  dataFlowDirection: DictionaryEntryRef | null;
  producerSystemId: string | null;
  consumerSystemIds: string[];
  tags: string[] | null;
  dataDomains: string[];
  environments: string[];
  active: boolean;
  securityPolicy: DictionaryEntryRef | null;
  integrationPattern: DictionaryEntryRef | null;
  messageFormat: DictionaryEntryRef | null;
  slaResponseTimeMs: number | null;
  slaUptimePct: number | null;
  slaTier: DictionaryEntryRef | null;
  slaDescription: string | null;
  owners: ApiGraphSystemOwnerRef[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ApiGraphResultDto {
  systems: ApiGraphSystemDto[];
  apis: ApiGraphEdgeDto[];
}

export interface ApiGraphSearchCriteria {
  /** OR filter: APIs where any of these systems appears as producer OR consumer (IT Systems flow) */
  systemIds?: string[] | null;
  /** Producer filter: APIs where producer is one of these systems */
  producerSystemIds?: string[] | null;
  /** Consumer filter: APIs where at least one consumer is in this list */
  consumerSystemIds?: string[] | null;
  typeIds?: string[] | null;
  transportLayerIds?: string[] | null;
  integrationPatternIds?: string[] | null;
  environmentIds?: string[] | null;
  dataDomainIds?: string[] | null;
  apiTags?: string[] | null;
  systemTags?: string[] | null;
  apiQuery?: string | null;
  systemNameQuery?: string | null;
  statusIds?: string[] | null;
  dataDomainQuery?: string | null;
  apiIds?: string[] | null;
}
