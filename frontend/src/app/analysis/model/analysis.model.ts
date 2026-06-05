export type BlastSeverity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DeprecationRisk = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BlastNodeType = 'SYSTEM' | 'API';

export interface BlastRadiusRequest {
  systemId?: string;
  apiId?: string;
  maxDepth: number;
}

export interface BlastRadiusNodeDto {
  id: string;
  code: string;
  name: string;
  nodeType: BlastNodeType;
  icon: string | null;
  statusName: string | null;
}

export interface BlastRadiusImpactedSystemDto {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  statusName: string | null;
  businessCriticalityName: string | null;
  depth: number;
}

export interface BlastRadiusImpactedApiDto {
  id: string;
  code: string;
  name: string;
  apiVersion: string | null;
  transportLayerName: string | null;
  producerSystemId: string | null;
  producerSystemName: string | null;
  depth: number;
}

export interface BlastRadiusResultDto {
  origin: BlastRadiusNodeDto;
  impactedSystems: BlastRadiusImpactedSystemDto[];
  impactedApis: BlastRadiusImpactedApiDto[];
  totalSystems: number;
  totalApis: number;
  severity: BlastSeverity;
  maxDepthReached: boolean;
  analysedAt: string;
}

// ── Deprecation Impact ────────────────────────────────────────────────────────

export interface DeprecationConsumerDto {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  statusName: string | null;
  businessCriticalityName: string | null;
  lifecycleStageName: string | null;
}

export interface DeprecatedApiReportItemDto {
  id: string;
  code: string;
  name: string;
  apiVersion: string | null;
  statusName: string | null;
  governanceNote: string | null;
  producerSystemId: string | null;
  producerSystemName: string | null;
  producerSystemIcon: string | null;
  consumers: DeprecationConsumerDto[];
  consumerCount: number;
  risk: DeprecationRisk;
}

export interface DeprecationImpactResultDto {
  deprecatedApis: DeprecatedApiReportItemDto[];
  totalDeprecatedApis: number;
  totalAffectedSystems: number;
  overallRisk: DeprecationRisk;
  riskDistribution: Record<DeprecationRisk, number>;
  analysedAt: string;
}
