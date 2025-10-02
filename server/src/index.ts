import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { router as apiRouter } from './routes';

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
