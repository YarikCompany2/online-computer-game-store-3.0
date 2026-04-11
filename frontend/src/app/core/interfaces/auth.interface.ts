export interface IUserTokenPayload {
  sub: string;
  email: string;
  role: string;
  companyId: string | null;
  username: string;
  balance: number;
  tokenType: 'access' | 'refresh';
  avatarUrl: string | null;
  iat?: number;
  exp?: number;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
}