export type BlastSeverity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
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
