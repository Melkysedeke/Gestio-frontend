import { Model, Relation } from '@nozbe/watermelondb'
import { field, text, date, readonly, relation } from '@nozbe/watermelondb/decorators'
import User from './User'

export default class Category extends Model {
  static table = 'categories'
  static associations = {
    users: { type: 'belongs_to', key: 'user_id' },
  } as const

  // Pode ser null se for categoria global (do sistema)
  @relation('users', 'user_id') user!: Relation<User>

  @text('name') name!: string
  @text('icon') icon!: string
  @text('type') type!: string // 'income' | 'expense'
  @text('color') color!: string
  @field('archived') archived!: boolean

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}