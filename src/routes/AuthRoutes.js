const express = require('express');
const passport = require('passport');

//Endpoints
const { signUp, login, googleAuth } = require('../controllers/AuthController');

const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);

//Third party authentication

//Google Auth
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}) );

router.get('/google/redirect', passport.authenticate('google', {failureRedirect: '/login'}), googleAuth);

//Facebook Auth
router.get('/facebook', passport.authenticate('facebook'));
router.get('/facebook/redirect', passport.authenticate('facebook', {failureRedirect: '/login'}), googleAuth)



module.exports = router;