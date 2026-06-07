export type ID = string

export enum UserRole {
  Admin = "Admin",
  Director = "Director",
  Seller = "Seller",
}

export interface JwtPayload {
  sub: ID
  username: string
  role: UserRole
  sellerId: ID | null
}

export interface AuthUser {
  id: ID
  username: string
  name: string
  role: UserRole
  sellerId: ID | null
}
