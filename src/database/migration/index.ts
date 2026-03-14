import { schemaMigrations, addColumns } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
  migrations: [
    {
      toVersion: 3,
      steps: [
        addColumns({
          table: 'users',
          columns: [{ name: 'deleted_at', type: 'number', isOptional: true }],
        }),
        addColumns({
          table: 'wallets',
          columns: [{ name: 'deleted_at', type: 'number', isOptional: true }],
        }),
        addColumns({
          table: 'categories',
          columns: [{ name: 'deleted_at', type: 'number', isOptional: true }],
        }),
        addColumns({
          table: 'debts',
          columns: [{ name: 'deleted_at', type: 'number', isOptional: true }],
        }),
        addColumns({
          table: 'goals',
          columns: [{ name: 'deleted_at', type: 'number', isOptional: true }],
        }),
        addColumns({
          table: 'transactions',
          columns: [{ name: 'deleted_at', type: 'number', isOptional: true }],
        }),
      ],
    },
  ],
})