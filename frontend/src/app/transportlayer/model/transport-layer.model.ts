export interface ItSystemRef {
  id: string;
  code: string;
  name: string;
  icon: string | null;
}

export interface TransportLayerSummaryDto {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  color: string | null;
  itSystem: ItSystemRef | null;
  active: boolean;
}

export interface TransportLayerDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  itSystem: ItSystemRef | null;
  active: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface TransportLayerCreateRequest {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  itSystemId: string | null;
}

export interface TransportLayerUpdateRequest {
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  itSystemId: string | null;
}

export interface TransportLayerSearchParams {
  query?: string;
  active?: boolean;
  page?: number;
  size?: number;
  sort?: string;
}
