const router = require('express').Router();
const {createService, editService, deleteService, getAllService, getAllServiceByVendor, getService, } = require('../controllers/ServiceController');
const {validateImage, uploadImages} = require('../middleware/UploadFiles');
const {protect, restrictTo} = require('../controllers/AuthController');


router.get('/', getAllService);
router.get('/:id', getService);
router.get('/vendor/:vendor_id', getAllServiceByVendor);
router.post('/create-service', protect, restrictTo('admin', 'super-admin'), validateImage, uploadImages,  createService);
router.put('/edit-service', protect, restrictTo('admin', 'super-admin'), editService);
router.delete('/:id', protect, restrictTo('admin', 'super-admin'), deleteService);


module.exports  = router;