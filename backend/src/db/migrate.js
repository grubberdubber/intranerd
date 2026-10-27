import { closeDatabase, initializeSchema } from './connection.js';

initializeSchema();
console.log('✅ Esquema SQLite verificado/creado.');
closeDatabase();
