import type { AuthRepository } from './AuthRepository'

export class SignIn {
  private readonly repository: AuthRepository

  constructor(repository: AuthRepository) {
    this.repository = repository
  }

  async execute(email: string, password: string) {
    const user = await this.repository.signIn(
      email.trim().toLowerCase(),
      password,
    )
    if (!user) throw new Error('El correo o la contraseña no son correctos.')
    return user
  }
}
