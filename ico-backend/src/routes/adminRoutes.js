const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Admin routes
router.get('/stats', adminController.getStats);
router.get('/purchases', adminController.getPurchases);
router.get('/users', adminController.getUsers);

module.exports = router;
