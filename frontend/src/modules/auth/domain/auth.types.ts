import { AuthUser } from '../../../core/domain/types/common.types';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
