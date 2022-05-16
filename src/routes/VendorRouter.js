const router = require('express').Router();
const {createVendor, changeLogo, getVendor, deactivateVendor} = require('../controllers/VendorController');
const {uploadBussinessLogo, validateImage, uploadSingle} = require('../middleware/UploadFiles')
const {protect, restrictTo} = require('../controllers/AuthController');

router.post('/create-vendor', protect, restrictTo('admin', 'super-admin'), validateImage, uploadBussinessLogo, createVendor );
router.post('/change-logo/:id', protect, restrictTo('admin'),  uploadSingle, changeLogo);
router.get('/get-vendor/:id', protect, getVendor);
router.patch('/deactive-vendor', protect, restrictTo('admin', 'super-admin'), deactivateVendor);


module.exports = router;