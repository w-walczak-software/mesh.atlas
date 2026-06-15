export type DatasourceType = 'POSTGRESQL' | 'SQLSERVER' | 'ORACLE';
export type PipelineStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED';
export type TargetEntityType = 'IT_SYSTEM' | 'API' | 'DATA_DOMAIN';
export type SyncStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
export type StagingStatus = 'PENDING' | 'SYNCED' | 'ERROR' | 'SKIPPED';
export type SyncAction = 'CREATE' | 'UPDATE' | 'SKIP';

export interface IntegrationDatasourceSummaryDto {
  id: string;
  code: string;
  name: string;
  type: DatasourceType;
  host: string;
  port: number;
  databaseName: string;
  active: boolean;
}

export interface IntegrationDatasourceDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: DatasourceType;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  active: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface IntegrationDatasourceCreateRequest {
  code: string;
  name: string;
  description?: string | null;
  type: DatasourceType;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password: string;
}

export interface IntegrationDatasourceUpdateRequest {
  name: string;
  description?: string | null;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  password?: string | null;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
}

export interface IntegrationPipelineSummaryDto {
  id: string;
  code: string;
  name: string;
  status: PipelineStatus;
  targetEntity: TargetEntityType;
  datasource: IntegrationDatasourceSummaryDto | null;
  hasDsl: boolean;
  active: boolean;
}

export interface IntegrationPipelineDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: PipelineStatus;
  targetEntity: TargetEntityType;
  datasource: IntegrationDatasourceSummaryDto | null;
  hasDsl: boolean;
  active: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface IntegrationPipelineCreateRequest {
  code: string;
  name: string;
  description?: string | null;
  targetEntity: TargetEntityType;
  datasourceId: string;
}

export interface IntegrationPipelineUpdateRequest {
  name: string;
  description?: string | null;
  status: PipelineStatus;
  datasourceId: string;
}

export interface SyncTriggerDto {
  syncRegistryId: string;
  message: string;
}

export interface PipelineDictionaryMappingDto {
  id: string;
  pipelineId: string;
  dictionaryTypeCode: string;
  externalValue: string | null;
  atlasEntry: { id: string; code: string; name: string };
  // Flat aliases populated client-side from atlasEntry for table display
  atlasEntryCode?: string;
  atlasEntryName?: string;
}

export interface PipelineDictionaryMappingRequest {
  dictionaryTypeCode: string;
  externalValue: string;
  atlasEntryId: string;
}

export interface PipelineDictionaryMappingUpdateValueRequest {
  externalValue?: string | null;
}

export interface PipelineDictionaryMappingInitResult {
  created: number;
  skipped: number;
}

export interface StagingItSystemDto {
  id: string;
  externalId: string | null;
  code: string | null;
  name: string | null;
  stagingStatus: StagingStatus;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface StagingApiDto {
  id: string;
  externalId: string | null;
  code: string | null;
  name: string | null;
  stagingStatus: StagingStatus;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface StagingDataDomainDto {
  id: string;
  externalId: string | null;
  code: string | null;
  name: string | null;
  stagingStatus: StagingStatus;
  errorMessage: string | null;
  processedAt: string | null;
  createdAt: string;
}

export interface SyncRegistrySummaryDto {
  id: string;
  pipelineId: string;
  pipelineCode: string;
  pipelineName: string;
  status: SyncStatus;
  executedBy: string;
  executedAt: string;
  completedAt: string | null;
  totalCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
}

export interface SyncRegistryDto {
  id: string;
  pipelineId: string;
  pipelineCode: string;
  pipelineName: string;
  status: SyncStatus;
  executedBy: string;
  executedAt: string;
  completedAt: string | null;
  totalCount: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  executionLog: string | null;
}

export interface SyncRegistryItemDto {
  id: string;
  entityType: TargetEntityType;
  externalId: string | null;
  targetId: string | null;
  action: SyncAction;
  status: StagingStatus;
  errorMessage: string | null;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
