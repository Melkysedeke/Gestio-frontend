import { Model, Relation } from '@nozbe/watermelondb'
import { field, text, date, readonly, relation } from '@nozbe/watermelondb/decorators'
import Wallet from './Wallet'

export default class Goal extends Model {
  static table = 'goals'
  static associations = {
    wallets: { type: 'belongs_to', key: 'wallet_id' },
  } as const

  @relation('wallets', 'wallet_id') wallet!: Relation<Wallet>

  @text('name') name!: string
  @field('target_amount') targetAmount!: number
  @field('current_amount') currentAmount!: number
  @text('color') color!: string
  @field('is_completed') isCompleted!: boolean
  
  @date('deadline') deadline!: Date

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}