import { Model, Relation, Query } from '@nozbe/watermelondb'
import { field, text, date, readonly, relation, children } from '@nozbe/watermelondb/decorators'
import Transaction from './Transaction'
import Debt from './Debt'
import Goal from './Goal'
import User from './User'

export default class Wallet extends Model {
    static table = 'wallets'
    static associations = {
        users: { type: 'belongs_to', key: 'user_id' }, // <- Adicione esta linha
        transactions: { type: 'has_many', foreignKey: 'wallet_id' },
        debts: { type: 'has_many', foreignKey: 'wallet_id' },
        goals: { type: 'has_many', foreignKey: 'wallet_id' },
    } as const

    @relation('users', 'user_id') user!: Relation<User>

    @text('name') name!: string
    @field('balance') balance!: number
    @text('color') color!: string
    @field('archived') archived!: boolean

    @children('transactions') transactions!: Query<Transaction>
    @children('debts') debts!: Query<Debt>
    @children('goals') goals!: Query<Goal>

    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date
}