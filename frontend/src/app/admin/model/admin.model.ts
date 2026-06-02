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

export type SystemParameterType = 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'DATE' | 'DATETIME';

export interface SystemParameterDto {
  id: string;
  parameterKey: string;
  parameterName: string;
  parameterType: SystemParameterType;
  description: string | null;
  category: string | null;
  stringValue: string | null;
  integerValue: number | null;
  decimalValue: number | null;
  booleanValue: boolean | null;
  dateValue: string | null;
  datetimeValue: string | null;
  systemDefined: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  version: number;
}

export interface SystemParameterUpdateRequest {
  parameterName: string;
  description: string | null;
  category: string | null;
  stringValue: string | null;
  integerValue: number | null;
  decimalValue: number | null;
  booleanValue: boolean | null;
  dateValue: string | null;
  datetimeValue: string | null;
}

export type EmailProvider = 'GMAIL' | 'EXCHANGE' | 'CUSTOM';
export type EmailEncryption = 'NONE' | 'TLS' | 'SSL';
export type EmailSendStatus = 'SENT' | 'FAILED';

export interface EmailConfigDto {
  id: string;
  provider: EmailProvider;
  host: string;
  port: number;
  username: string | null;
  passwordSet: boolean;
  fromAddress: string | null;
  fromDisplayName: string | null;
  encryption: EmailEncryption;
  enabled: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface EmailConfigSaveRequest {
  provider: EmailProvider;
  host: string;
  port: number;
  username: string | null;
  password: string | null;
  fromAddress: string;
  fromDisplayName: string | null;
  encryption: EmailEncryption;
  enabled: boolean;
}

export interface EmailLogDto {
  id: string;
  sentAt: string;
  recipient: string;
  subject: string;
  status: EmailSendStatus;
  errorMessage: string | null;
  sentBy: string | null;
  test: boolean;
}

export interface EmailTemplateDto {
  id: string;
  code: string;
  title: string;
  body: string;
  description: string | null;
  tags: string[];
  active: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  version: number;
}

export interface EmailTemplateSummaryDto {
  id: string;
  code: string;
  title: string;
  description: string | null;
  tags: string[];
  active: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface EmailTemplateCreateRequest {
  code: string;
  title: string;
  body: string;
  description: string | null;
  tags: string[];
}

export interface EmailTemplateUpdateRequest {
  title: string;
  body: string;
  description: string | null;
  tags: string[];
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
