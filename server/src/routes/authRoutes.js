import express from 'express';
import { login, registerSociety, provisionUser, getMe, changePassword } from '../controllers/authController.js';
import { verifyToken, requireRoles } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/register-society', registerSociety);
router.post('/provision-user', verifyToken, requireRoles('admin'), provisionUser);
router.get('/me', verifyToken, getMe);
router.put('/change-password', verifyToken, changePassword);

export default router;
