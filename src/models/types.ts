export type Role = 'Admin' | 'Accountant';

export interface UserPayload {
  email: string;
  role: Role;
}
