import { ApiGraphEdgeDto, ApiGraphSystemOwnerRef, TransportLayerRef } from '../model/api.model';

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
  tags: string[] | null;
  owners: ApiGraphSystemOwnerRef[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ApiEdgeGroupData {
  /** Unique key: `{producerSystemId}__{consumerSystemId}__{transportCode}__{directionCode}` */
  edgeKey: string;
  producerSystemId: string;
  consumerSystemId: string;
  /** Transport layer shared by all APIs in this group */
  transportLayer: TransportLayerRef | null;
  /** All APIs sharing this transport + direction between the two systems */
  apis: ApiGraphEdgeDto[];
  edgeColor: string;
  /** Stroke width in px — scales with the number of APIs (min 2, max 6) */
  strokeWidth: number;
  /** Vertical bezier control-point offset (px) for rendering parallel edges between the same system pair */
  parallelOffset: number;
  /** True when dataFlowDirection = PUSH (Consumer → Producer), so the animation runs backward along the edge */
  reverseFlow: boolean;
}
