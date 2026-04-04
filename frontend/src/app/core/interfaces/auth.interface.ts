export interface IUserTokenPayload {
  sub: string;
  email: string;
  role: string;
  companyId: string | null;
  username: string;
  balance: number;
  tokenType: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface IAuthResponse {
  accessToken: string;
  refreshToken: string;
}