import { UserRole } from '../../../core/domain/types/common.types';

export interface EquipoUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  sellerId: string | null;
  active: boolean;
  createdAt: string;
}

export interface EquipoSeller {
  id: string;
  name: string;
  profile: string | null;
  userId: string | null;
  active: boolean;
  createdAt: string;
}

export interface PaginatedUsers {
  data: EquipoUser[];
  total: number;
}
