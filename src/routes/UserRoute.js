const express = require('express');
const { protect, changePassword } = require('../controllers/AuthController');
const {getUser, disableAccount, getMe, updateMe, changeProfilePicture} = require('../controllers/UserController');
const {uploadSingle}  = require('../middleware/UploadFiles');


const router = express.Router();

router.get('/get-user/:user_id', protect, getUser);
router.get('/get-me', protect, getMe);
router.put('/update-me', protect, updateMe);
router.patch('/change-password', protect, changePassword)
router.post('/update-profile-picture', protect, uploadSingle, changeProfilePicture);
// router.put('/', protect, updateAccount);
// router.delete('/disable-account', protect, disableAccount);


module.exports = router;
