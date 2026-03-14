import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { mySchema } from './schema'; 
import User from './models/User';
import Wallet from './models/Wallet';
import Category from './models/Category';
import Debt from './models/Debt';
import Goal from './models/Goal';
import Transaction from './models/Transaction';
import migrations from './migration' 

const adapter = new SQLiteAdapter({
  schema: mySchema,
  migrations,
  jsi: true, 
  onSetUpError: error => {
    console.error('Erro ao configurar o banco de dados:', error);
  }
})

export const database = new Database({
  adapter,
  modelClasses: [
    User,
    Wallet,
    Category,
    Debt,
    Goal,
    Transaction
  ],
});