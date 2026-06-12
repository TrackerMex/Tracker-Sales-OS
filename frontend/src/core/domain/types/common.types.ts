export type ID = string

export const UserRole = {
  Admin: "Admin",
  Director: "Director",
  Seller: "Seller",
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

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
