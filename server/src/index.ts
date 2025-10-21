import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { PrismaClient } from './generated/prisma';
import authRouter from './routes/auth';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(bodyParser.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', authRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${port}`);
});
