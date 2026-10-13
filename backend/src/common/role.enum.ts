/** Role of a user; decides which endpoints the user may call. */
export enum Role {
  /** Maintains the shared catalogue of music items. */
  ADMIN = 'ADMIN',
  /** Manages their own personal collection. */
  USER = 'USER',
}
