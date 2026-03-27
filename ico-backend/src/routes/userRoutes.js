const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// User routes
router.get('/purchases', userController.getPurchases);
router.get('/claims', userController.getClaims);

module.exports = router;
