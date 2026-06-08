export type SubscriberType = 'INTERNAL' | 'EXTERNAL';
export type SubscriptionSource = 'INTERNAL_PORTAL' | 'DEVELOPER_PORTAL';
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_CONFIRMATION';

export interface ApiSubscriptionDto {
  id: string;
  apiId: string;
  apiCode: string;
  apiName: string;
  apiVersion: string | null;
  producerSystemName: string | null;
  subscriberType: SubscriberType;
  subscriberUserId: string | null;
  subscriberEmail: string;
  subscriberName: string | null;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  notificationsEnabled: boolean;
  subscribedAt: string;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ApiSubscriptionSummaryDto {
  id: string;
  apiId: string;
  apiCode: string;
  apiName: string;
  apiVersion: string | null;
  producerSystemName: string | null;
  subscriberType: SubscriberType;
  subscriberEmail: string;
  subscriberName: string | null;
  status: SubscriptionStatus;
  notificationsEnabled: boolean;
  subscribedAt: string;
}

export interface ApiSubscriptionStatsDto {
  myActiveSubscriptions: number;
  managedApisSubscribersCount: number;
  newSubscriptionsLastWeek: number;
}

export interface ApiSubscriptionSelfRequest {
  apiId: string;
}

export interface ApiSubscriptionAdminRequest {
  apiId: string;
  subscriberType: SubscriberType;
  subscriberUserId: string | null;
  subscriberEmail: string;
  subscriberName: string | null;
  status: SubscriptionStatus;
  source: SubscriptionSource;
  notificationsEnabled: boolean;
}
