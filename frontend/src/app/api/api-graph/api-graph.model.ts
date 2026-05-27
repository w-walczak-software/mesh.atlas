import { ApiGraphEdgeDto, TransportLayerRef } from '../model/api.model';

export interface SystemNodeData {
  systemId: string;
  code: string;
  name: string;
  icon: string | null;
  statusName: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  /** Shown in tooltip and preview dialog */
  description: string | null;
  systemTypeName: string | null;
  lifecycleStageName: string | null;
  businessCriticalityName: string | null;
  dataClassificationName: string | null;
  architectureStyleName: string | null;
}

export interface ApiEdgeGroupData {
  /** Unique key: `{producerSystemId}__{consumerSystemId}` */
  edgeKey: string;
  producerSystemId: string;
  consumerSystemId: string;
  /** Primary transport layer (first API in the group) — used for label display */
  transportLayer: TransportLayerRef | null;
  /** All APIs on this directed connection, possibly with different transport layers */
  apis: ApiGraphEdgeDto[];
  edgeColor: string;
}
