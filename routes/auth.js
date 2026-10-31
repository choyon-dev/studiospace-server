const express = require('express');
const jwt = require('jsonwebtoken');
const { verifyToken, getCookieOptions } = require('../middleware/auth');

const router = express.Router();

router.post('/jwt', (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required to generate a session token',
    });
  }

  const payload = {
    email: email.toLowerCase().trim(),
    name: name ? name.trim() : 'Creator',
  };

  const secret = process.env.JWT_SECRET || 'studiospace_jwt_secret_dev_key_2026_hermes';
  const token = jwt.sign(payload, secret, { expiresIn: '7d' });

  res.cookie('token', token, getCookieOptions());

  return res.status(200).json({
    success: true,
    message: 'Authentication token issued',
    token,
    user: payload,
  });
});

router.post('/logout', (req, res) => {
  const cookieOptions = getCookieOptions();
  res.clearCookie('token', {
    ...cookieOptions,
    maxAge: 0,
  });

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});

router.get('/me', verifyToken, (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
});

module.exports = router;
