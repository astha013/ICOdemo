const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Root admin route - returns available endpoints
router.get('/', (req, res) => {
  res.json({
    message: 'Admin API',
    endpoints: {
      stats: '/admin/stats',
      purchases: '/admin/purchases',
      users: '/admin/users',
    },
  });
});

// Admin routes
router.get('/stats', adminController.getStats);
router.get('/purchases', adminController.getPurchases);
router.get('/users', adminController.getUsers);

module.exports = router;
