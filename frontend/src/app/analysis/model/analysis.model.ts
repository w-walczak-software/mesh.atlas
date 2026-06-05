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

// ── What-if Analysis ──────────────────────────────────────────────────────────

export type WhatIfScenarioType = 'SYSTEM_SHUTDOWN';
export type WhatIfRisk = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type WhatIfRecommendationLevel = 'INFO' | 'WARNING' | 'CRITICAL';

export interface WhatIfRequest {
  scenarioType: WhatIfScenarioType;
  systemId: string;
  maxDepth: number;
}

export interface WhatIfScenarioNodeDto {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  statusName: string | null;
  businessCriticalityName: string | null;
  lifecycleStageName: string | null;
}

export interface WhatIfDecommissionedApiDto {
  id: string;
  code: string;
  name: string;
  apiVersion: string | null;
  transportLayerName: string | null;
  statusName: string | null;
  slaTierName: string | null;
  dataDomainNames: string[];
  directConsumerCount: number;
}

export interface WhatIfAffectedSystemDto {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  statusName: string | null;
  businessCriticalityName: string | null;
  lifecycleStageName: string | null;
  consumedAffectedApiNames: string[];
  depth: number;
  risk: WhatIfRisk;
}

export interface WhatIfDataDomainImpactDto {
  id: string;
  code: string;
  name: string;
  groupName: string | null;
  affectedApiNames: string[];
  alternativeProviderCount: number;
  orphaned: boolean;
}

export interface WhatIfRecommendationDto {
  level: WhatIfRecommendationLevel;
  message: string;
}

export interface WhatIfResultDto {
  origin: WhatIfScenarioNodeDto;
  scenarioType: WhatIfScenarioType;
  decommissionedApis: WhatIfDecommissionedApiDto[];
  affectedSystems: WhatIfAffectedSystemDto[];
  affectedDataDomains: WhatIfDataDomainImpactDto[];
  totalDecommissionedApis: number;
  totalAffectedSystems: number;
  totalAffectedDataDomains: number;
  orphanedDataDomains: number;
  overallRisk: WhatIfRisk;
  maxDepthReached: boolean;
  recommendations: WhatIfRecommendationDto[];
  analysedAt: string;
}
