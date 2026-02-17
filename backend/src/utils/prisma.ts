import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../dev.db');
const dbUrl = `file:${dbPath}`;

const adapter = new PrismaBetterSqlite3({
  url: dbUrl,
});

const prisma = new PrismaClient({ adapter });

export default prisma;
