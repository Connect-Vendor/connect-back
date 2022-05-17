const router = require('express').Router();
const {createVendor, changeLogo, getVendor, deactivateVendor, editVendor, getAllVendor, upgradeToVendor} = require('../controllers/VendorController');
const {uploadBussinessLogo, validateImage, uploadSingle} = require('../middleware/UploadFiles')
const {protect, restrictTo} = require('../controllers/AuthController');

router.post('/create-vendor', protect, restrictTo('admin', 'super-admin'), validateImage, uploadBussinessLogo, createVendor );
router.post('/change-logo/:id', protect, restrictTo('admin'),  uploadSingle, changeLogo);
router.get('/get-vendor/:id', protect, getVendor);
router.delete('/deactivate-vendor/:id', protect, restrictTo('admin', 'super-admin'), deactivateVendor);
router.put('/edit-vendor/:id', protect, restrictTo('admin'), editVendor);
router.get('/fetch-vendors', protect, restrictTo('super-admin'), getAllVendor);
router.post('/upgrade', protect, restrictTo('user'),  validateImage, uploadBussinessLogo, upgradeToVendor);

module.exports = router;