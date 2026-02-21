import { Model } from '@nozbe/watermelondb'
import { text, date, readonly, json } from '@nozbe/watermelondb/decorators'

// 1. Tipar o argumento da função
const sanitizeSettings = (rawSettings: string): any => {
  return typeof rawSettings === 'string' ? JSON.parse(rawSettings) : rawSettings
}

export default class User extends Model {
  static table = 'users'

  // 2. Adicionar '!: string' para resolver o erro "implicitly has any type"
  @text('name') name!: string
  @text('email') email!: string
  @text('password') password!: string
  @text('avatar') avatar!: string
  
  // Settings é um objeto, então usamos 'any' ou criamos uma interface depois
  @json('settings', sanitizeSettings) settings!: any

  // 3. Datas no WatermelonDB viram objetos Date no JS (não number)
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date

  get last_opened_wallet(): string | null {
    return this.settings?.last_opened_wallet || null;
  }
}