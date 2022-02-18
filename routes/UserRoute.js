const express = require('express');
const { Signup, login } = require('../controllers/UserController');

const router = express.Router();

router.post('/create-user', Signup);
router.post('/login', login);

module.exports = router;
