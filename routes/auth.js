const express = require('express');
const router = express.Router();
const { register, login, forgotPassword, resetPassword, changePassword, getProfile } = require('../controllers/authController');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');

router.post('/register', [
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], login);

router.post('/forgot-password', [body('email').isEmail().withMessage('Valid email is required')], forgotPassword);
router.post('/reset-password', [body('token').notEmpty(), body('email').isEmail(), body('newPassword').isLength({ min: 6 })], resetPassword);
router.put('/change-password', authMiddleware, [body('oldPassword').notEmpty(), body('newPassword').isLength({ min: 6 })], changePassword);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
