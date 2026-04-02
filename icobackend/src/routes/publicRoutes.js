const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.get('/purchases/:wallet', publicController.getPurchasesByWallet);
router.get('/claims/:wallet', publicController.getClaimsByWallet);

// Protected routes (authentication required)
router.post('/purchases', authMiddleware, publicController.createPurchase);

module.exports = router;
