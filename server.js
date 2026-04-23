import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Test database connection route
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    res.json({ message: 'Database connected successfully', result });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'POS API is running' });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
  console.log('Database connection will be tested at /api/test-db');
});
