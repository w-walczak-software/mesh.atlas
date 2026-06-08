import { DictionaryEntryRef } from '../../api/model/api.model';

export type ChangeRequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'DEFERRED'
  | 'IMPLEMENTED'
  | 'CANCELLED';

export type ReviewDecision = 'APPROVED' | 'REJECTED' | 'DEFERRED' | 'NEEDS_CLARIFICATION';

export type ReviewerRole = 'TECHNICAL_OWNER' | 'BUSINESS_OWNER' | 'ADMIN';

export type RequesterType = 'INTERNAL' | 'DEVELOPER_PORTAL';

export interface ChangeRequestReviewDto {
  id: string;
  reviewerRole: ReviewerRole;
  reviewerName: string | null;
  reviewerEmail: string;
  decision: ReviewDecision;
  comment: string | null;
  reviewedAt: string;
}

export interface ChangeRequestDto {
  id: string;
  apiId: string;
  apiCode: string;
  apiName: string;
  apiVersion: string;
  producerSystemName: string | null;
  title: string;
  description: string;
  changeType: DictionaryEntryRef;
  priority: DictionaryEntryRef;
  status: ChangeRequestStatus;
  requesterType: RequesterType;
  requesterEmail: string;
  requesterName: string | null;
  plannedImplementationDate: string | null;
  plannedVersion: string | null;
  implementedAt: string | null;
  implementedVersion: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  reviews: ChangeRequestReviewDto[];
}

export interface ChangeRequestSummaryDto {
  id: string;
  apiId: string;
  apiCode: string;
  apiName: string;
  apiVersion: string;
  title: string;
  changeType: DictionaryEntryRef;
  priority: DictionaryEntryRef;
  status: ChangeRequestStatus;
  requesterType: RequesterType;
  requesterEmail: string;
  requesterName: string | null;
  plannedImplementationDate: string | null;
  plannedVersion: string | null;
  createdAt: string;
  currentUserIsOwner: boolean;
  currentUserIsRequester: boolean;
}

export interface ChangeRequestSubmitRequest {
  apiId: string;
  title: string;
  description: string;
  changeTypeId: string;
  priorityId: string;
}

export interface ChangeRequestReviewRequest {
  decision: ReviewDecision;
  comment: string | null;
  plannedImplementationDate: string | null;
  plannedVersion: string | null;
}

export interface MarkImplementedRequest {
  implementedVersion: string | null;
  note: string | null;
}

export interface ChangeRequestSearchParams {
  apiId?: string;
  status?: ChangeRequestStatus;
  changeTypeId?: string;
  priorityId?: string;
  requesterEmail?: string;
  searchText?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string;
}
