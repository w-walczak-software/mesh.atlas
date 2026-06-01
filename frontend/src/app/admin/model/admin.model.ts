export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AdminUserDto {
  id: string;
  username: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  enabled: boolean;
  createdAt: string | null;
}

export interface AdminRoleDto {
  id: string;
  name: string;
  description: string | null;
  composite: boolean;
  clientRole: boolean;
}

export interface UserRolesUpdateRequest {
  roleNames: string[];
}

export interface AuditLogEntryDto {
  id: string;
  eventTime: string;
  category: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  resourceName: string | null;
  actorId: string | null;
  actorUsername: string;
  actorEmail: string | null;
  outcome: 'SUCCESS' | 'FAILURE';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string | null;
  context: Record<string, unknown> | null;
  errorDetail: string | null;
}

export interface AuditLogSearchParams {
  actorUsername?: string;
  category?: string;
  action?: string;
  resourceType?: string;
  outcome?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}
