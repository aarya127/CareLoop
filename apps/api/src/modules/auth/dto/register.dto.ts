export class RegisterDto {
  email!: string;
  password!: string;
  firstName!: string;
  lastName!: string;
  practiceId!: string;
  role?: 'STAFF' | 'MANAGER' | 'ADMIN' | 'SERVICE_ACCOUNT';
}
