import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
  version: 2,
  tables: [
    // 1. USERS
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'password', type: 'string', isOptional: true }, // Cuidado com segurança aqui
        { name: 'avatar', type: 'string', isOptional: true },
        { name: 'settings', type: 'string', isOptional: true }, // Vamos salvar o JSON como string
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // 2. WALLETS
    tableSchema({
      name: 'wallets',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'balance', type: 'number' },
        { name: 'color', type: 'string' },
        { name: 'archived', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // 3. CATEGORIES
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'user_id', type: 'string', isOptional: true, isIndexed: true }, // Nullable para globais
        { name: 'name', type: 'string' },
        { name: 'icon', type: 'string' },
        { name: 'type', type: 'string' }, // 'income', 'expense', etc
        { name: 'color', type: 'string' },
        { name: 'archived', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // 4. DEBTS
    tableSchema({
      name: 'debts',
      columns: [
        { name: 'wallet_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'entity_name', type: 'string', isOptional: true },
        { name: 'amount', type: 'number' },
        { name: 'total_paid', type: 'number' },
        { name: 'due_date', type: 'number' }, // Data como timestamp
        { name: 'is_paid', type: 'boolean' },
        { name: 'paid_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // 5. GOALS
    tableSchema({
      name: 'goals',
      columns: [
        { name: 'wallet_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'target_amount', type: 'number' },
        { name: 'current_amount', type: 'number' },
        { name: 'deadline', type: 'number', isOptional: true },
        { name: 'color', type: 'string' },
        { name: 'is_completed', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    // 6. TRANSACTIONS
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'wallet_id', type: 'string', isIndexed: true },
        { name: 'category_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'debt_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'goal_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'amount', type: 'number' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'transaction_date', type: 'number' },
        { name: 'category_name', type: 'string' },
        { name: 'category_icon', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
})