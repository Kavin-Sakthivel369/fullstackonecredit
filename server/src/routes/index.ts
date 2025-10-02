import { Router } from 'express';
import authRouter from './modules/auth';
import jobsRouter from './modules/jobs';
import applicationsRouter from './modules/applications';
import brokerageRouter from './modules/brokerage';
import messagesRouter from './modules/messages';

export const router = Router();

router.use('/auth', authRouter);
router.use('/jobs', jobsRouter);
router.use('/applications', applicationsRouter);
router.use('/brokerage', brokerageRouter);
router.use('/messages', messagesRouter);
