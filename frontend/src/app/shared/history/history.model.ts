export type RevisionType = 'ADDED' | 'MODIFIED' | 'DELETED';

export interface RevisionEntryDto<T> {
  revisionNumber: number;
  revisionType: RevisionType;
  revisionTimestamp: string;
  username: string | null;
  userId: string | null;
  snapshot: T;
}

export interface HistoryField {
  label: string;
  value: string | null;
}
