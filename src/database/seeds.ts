import { database } from './index'
import Category from './models/Category'

export async function seedCategories() {
  const categoriesCollection = database.get<Category>('categories')
 
  const count = await categoriesCollection.query().fetchCount()
  if (count > 0) return

  const defaultCategories = [
    // Despesas
    { name: 'Alimentação', icon: 'restaurant', type: 'expense', color: '#ef4444' },
    { name: 'Transporte', icon: 'directions-bus', type: 'expense', color: '#3b82f6' },
    { name: 'Casa', icon: 'home', type: 'expense', color: '#f59e0b' },
    { name: 'Compras', icon: 'shopping-cart', type: 'expense', color: '#ec4899' },
    { name: 'Saúde', icon: 'local-hospital', type: 'expense', color: '#ef4444' },
    { name: 'Lazer', icon: 'movie', type: 'expense', color: '#8b5cf6' },
    { name: 'Educação', icon: 'school', type: 'expense', color: '#6366f1' },
    { name: 'Outros', icon: 'more-horiz', type: 'expense', color: '#64748b' },
    // Receitas
    { name: 'Salário', icon: 'attach-money', type: 'income', color: '#22c55e' },
    { name: 'Freelance', icon: 'computer', type: 'income', color: '#06b6d4' },
    { name: 'Investimento', icon: 'trending-up', type: 'income', color: '#8b5cf6' },
    { name: 'Presente', icon: 'card-giftcard', type: 'income', color: '#f43f5e' },
    // Dívidas
    { name: 'Dívida', icon: 'receipt-long', type: 'debts', color: '#fa6238' },
    { name: 'Empréstimo', icon: 'handshake', type: 'debts', color: '#1773cf' },
    // Investimento
    { name: 'Objetivo', icon: 'savings', type: 'goals', color: '#0bda5b' },
  ]

  await database.write(async () => {
    const batch = defaultCategories.map(cat =>
      categoriesCollection.prepareCreate(c => {
        c.name = cat.name
        c.icon = cat.icon
        c.type = cat.type
        c.color = cat.color
        c.archived = false
      })
    )
    await database.batch(...batch)
  })
}

