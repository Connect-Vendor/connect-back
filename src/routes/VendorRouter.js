const router = require('express').Router();
const {createVendor} = require('../controllers/VendorController');
const {uploadBussinessLogo, validateImage} = require('../middleware/UploadFiles')
const {protect, restrictTo} = require('../controllers/AuthController');

router.post('/create-vendor', protect, restrictTo('admin', 'super-admin'), validateImage, uploadBussinessLogo, createVendor );


module.exports = router;