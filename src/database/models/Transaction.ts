import { Model, Relation } from '@nozbe/watermelondb'
import { field, text, date, readonly, relation } from '@nozbe/watermelondb/decorators'
import User from './User'
import Wallet from './Wallet'
import Category from './Category'
import Debt from './Debt'
import Goal from './Goal'

export default class Transaction extends Model {
  static table = 'transactions'

  static associations = {
    wallets: { type: 'belongs_to', key: 'wallet_id' },
    categories: { type: 'belongs_to', key: 'category_id' },
    debts: { type: 'belongs_to', key: 'debt_id' },
    goals: { type: 'belongs_to', key: 'goal_id' },
    users: { type: 'belongs_to', key: 'user_id' },
  } as const 

  // Associações (Relacionamentos)
  @relation('users', 'user_id') user!: Relation<User>
  @relation('wallets', 'wallet_id') wallet!: Relation<Wallet>
  @relation('categories', 'category_id') category!: Relation<Category>
  @relation('debts', 'debt_id') debt!: Relation<Debt>
  @relation('goals', 'goal_id') goal!: Relation<Goal>

  // Campos de dados
  @text('type') type!: string
  @field('amount') amount!: number
  @text('description') description!: string
  @text('category_name') categoryName!: string
  @text('category_icon') categoryIcon!: string
  @date('transaction_date') transactionDate!: Date 
  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date

  // Getters para acessar os IDs sem disparar erros de colisão de decoradores
  get walletId(): string { return (this as any)._raw.wallet_id }
  get categoryId(): string | null { return (this as any)._raw.category_id }
  get debtId(): string | null { return (this as any)._raw.debt_id }
  get goalId(): string | null { return (this as any)._raw.goal_id }
}