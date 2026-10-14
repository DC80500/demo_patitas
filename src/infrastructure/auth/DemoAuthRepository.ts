import type { AuthRepository } from '../../application/auth/AuthRepository'
import type { User } from '../../domain/auth/User'
import { demoCredentials } from './demoCredentials'

// Credenciales públicas de demostración. No proporciona autenticación real.
export class DemoAuthRepository implements AuthRepository {
  async signIn(email: string, password: string): Promise<User | null> {
    if (
      email !== demoCredentials.email ||
      password !== demoCredentials.password
    )
      return null
    return {
      id: 'demo-admin',
      name: 'Equipo Patitas',
      email,
      role: 'administrator',
    }
  }
}
