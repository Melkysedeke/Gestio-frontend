import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const mySchema = appSchema({
  version: 3, // 🚀 Incrementei a versão para forçar atualização se necessário
  tables: [
    tableSchema({
      name: 'users',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'password', type: 'string', isOptional: true },
        { name: 'avatar', type: 'string', isOptional: true },
        { name: 'settings', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true }, // 🚀 Adicionado
      ],
    }),
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
        { name: 'deleted_at', type: 'number', isOptional: true }, // 🚀 Adicionado
      ],
    }),
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'user_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'icon', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'color', type: 'string' },
        { name: 'archived', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true }, // 🚀 Adicionado
      ],
    }),
    tableSchema({
      name: 'debts',
      columns: [
        { name: 'wallet_id', type: 'string', isIndexed: true },
        { name: 'type', type: 'string' },
        { name: 'title', type: 'string' },
        { name: 'entity_name', type: 'string', isOptional: true },
        { name: 'amount', type: 'number' },
        { name: 'total_paid', type: 'number' },
        { name: 'due_date', type: 'number' },
        { name: 'is_paid', type: 'boolean' },
        { name: 'paid_at', type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true }, // 🚀 Adicionado
      ],
    }),
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
        { name: 'deleted_at', type: 'number', isOptional: true }, // 🚀 Adicionado
      ],
    }),
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
        { name: 'deleted_at', type: 'number', isOptional: true }, // 🚀 Adicionado
      ],
    }),
  ],
})