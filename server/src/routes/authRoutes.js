import express from 'express';
import { login, demoLogin, getMe, getDemoAccounts } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/demo-login', demoLogin);
router.get('/demo-accounts', getDemoAccounts);
router.get('/me', verifyToken, getMe);

export default router;
