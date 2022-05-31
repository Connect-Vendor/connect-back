const express = require('express');
const { adminAnalysis, vendorAnalysis, userAnalysis } = require('../controllers/AdminController');
const { protect, restrictTo } = require('../controllers/AuthController');

const router = express.Router();

router.get('/admin-analysis', protect, restrictTo('super-admin'),  adminAnalysis);
router.get('/vendor-analysis', protect, restrictTo('admin'), vendorAnalysis);
router.get('/user-analysis', protect, restrictTo('user'), userAnalysis);

module.exports = router;