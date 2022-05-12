const router = require('express').Router();
const {protect, restrictTo} = require('../controllers/AuthController');
const {addAccount, checkoutService, verifyPayment} = require('../controllers/PaymentController');


router.post('/create-sub-account', protect, restrictTo('admin'), addAccount);
router.get('/verify-payment', verifyPayment);
router.get('/initilaze-service-payment/:service_id', protect, checkoutService);

module.exports = router;