const router = require('express').Router();
const {protect, restrictTo} = require('../controllers/AuthController');
const {addAccount, checkoutService, verifyPayment, verifyAccountNumber, getAccount, updateAccount, fetchVendorsAccounts, toggleAccountStatus} = require('../controllers/PaymentController');


router.post('/create-sub-account', protect, restrictTo('admin', 'super-admin'), verifyAccountNumber,  addAccount);
router.get('/verify-payment', verifyPayment);
router.get('/verify-acc/:bank_code/:account_number', verifyAccountNumber);
router.get('/get-vendor-accounts/:vendor_id', fetchVendorsAccounts);
router.delete('/subaccount/:account_code', protect, restrictTo('admin', 'super-admin', toggleAccountStatus))
router.put('/subaccount/:account_code', protect, restrictTo('admin', 'super-admin'), verifyAccountNumber, updateAccount)
router.get('/subaccount/:account_code', getAccount);
router.get('/initilaze-service-payment/:service_id', protect, checkoutService);

module.exports = router;