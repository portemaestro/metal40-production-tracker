import { Router } from 'express';
import authRoutes from './auth';
import ordiniRoutes from './ordini';
import materialiRoutes from './materiali';
import fasiRoutes from './fasi';
import problemiRoutes from './problemi';
import noteRoutes from './note';
import dashboardRoutes from './dashboard';
import uploadRoutes from './upload';
import adminRoutes from './admin';

const router = Router();

router.use('/auth', authRoutes);
router.use('/ordini', ordiniRoutes);
router.use('/materiali', materialiRoutes);
router.use('/fasi', fasiRoutes);
router.use('/problemi', problemiRoutes);
router.use('/note', noteRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/upload', uploadRoutes);
router.use('/admin', adminRoutes);

export default router;
