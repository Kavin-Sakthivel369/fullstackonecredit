import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { json } from 'express';
import apiRoutes from './routes';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRoutes);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
