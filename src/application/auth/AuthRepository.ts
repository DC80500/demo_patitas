import type { User } from '../../domain/auth/User'

export interface AuthRepository {
  signIn(email: string, password: string): Promise<User | null>
}
