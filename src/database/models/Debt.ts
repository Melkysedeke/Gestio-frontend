import { Model, Relation } from '@nozbe/watermelondb'
import { field, text, date, readonly, relation } from '@nozbe/watermelondb/decorators'
import Wallet from './Wallet'

export default class Debt extends Model {
  static table = 'debts'
  static associations = {
    wallets: { type: 'belongs_to', key: 'wallet_id' },
  } as const

  @relation('wallets', 'wallet_id') wallet!: Relation<Wallet>

  @text('type') type!: string
  @text('title') title!: string
  @text('entity_name') entityName!: string
  @field('amount') amount!: number
  @field('total_paid') totalPaid!: number
  @field('is_paid') isPaid!: boolean
  
  // Datas (Note que usamos Date, pois o decorator converte o timestamp)
  @date('due_date') dueDate!: Date
  @date('paid_at') paidAt!: Date

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date
}