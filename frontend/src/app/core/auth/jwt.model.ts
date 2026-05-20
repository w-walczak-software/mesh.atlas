export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  initials: string;
}
