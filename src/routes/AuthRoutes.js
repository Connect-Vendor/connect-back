const express = require('express');

//Endpoints
const { signUp, login } = require('../controllers/AuthController');

const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);



module.exports = router;