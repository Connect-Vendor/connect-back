const User = require('../models/User');
const AsyncHandler = require("../utils/AsyncHandler");
const ErrorHandler = require("../utils/Errorhandler");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const response = require("../utils/response");
const Email = require('../utils/EmailUtil');


/**
 * @desc Signup a user
 * @param : first_name, last_name, password, email, phone
 * @route Post /api/v1/auth/signup
 */
exports.signUp = AsyncHandler(async (req, res, next) => {
    //Get user data
    const { first_name, last_name, password, email, phone, role } = req.body;
    let userRole;

    //Check parameters
    if (!first_name) return next(new ErrorHandler('first name is required', 200, 'e404'));

    if (!last_name) return next(new ErrorHandler('last name is required', 200, 'e404'));

    if (!password) return next(new ErrorHandler('password is required', 200, 'e404'));

    if (!email) return next(new ErrorHandler('password is required', 200, 'e404'));

    if (!phone) return next(new ErrorHandler('phone number is required', 200, 'e404'));

    if(!role) {
        userRole = 'user'
    }else{
        userRole = role === 'admin' ? 'admin' : 'user'
    }

    //Validate Email
    const regex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

    if (!regex.test(email)) return next(new ErrorHandler('Email address is not valid', 200, 'e402'));

    //Check if user Exits
    const user = await User.findOne({ email });

    if (user) return next(new ErrorHandler('User already exist', 200, 'e401'));

    //create hash password
    const passwordHash = await bcrypt.hash(password, 12);

    //Create user
    const newUser = await User.create({
        password: passwordHash,
        first_name,
        last_name,
        role: userRole,
        email,
        phone
    });

    //Send email
    if (newUser) {
        const url = `${req.protocol}://${req.get('host')}/me`;
        await new Email(newUser, url).sendWelcome();
    }

    //create Token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_PKEY, {
        expiresIn: process.env.JWT_EXPIRATION,
    });

    //send cookie
    const cookieOpt = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        secure: false, // makes it secure via https,
        sameSite: 'strict',
        httpOnly: true, //makes it impossible for the cookie to be modified in any way by the browser
    };

    res.cookie('auth', token, cookieOpt);

    //Remove password from response data
    newUser.password = undefined;

    return response(res, 200, 's200', 'User created successfully', {token, user: newUser});

});


/**
 * @desc Login a user
 * @param : password, email
 * @route Post /api/v1/auth/login
 */
exports.login = AsyncHandler(async (req, res, next) => {
    //Get user login creadientials
    const {password, email} = req.body;

    if(!password) return next(new ErrorHandler('Password is require', 200, 'e404')); 
    
    if(!email) return next(new ErrorHandler('Email is require', 200, 'e404')); 

    //Check is user exist
    const user = await User.findOne({email}).select('+password');

    if(!user || !(await user.isPasswordCorrect(password, user.password))) return next(new ErrorHandler('Incorrect email or password', 200, 'e401'));

    //create send token
    const token = jwt.sign({id: user._id}, process.env.JWT_PKEY, {
        expiresIn: process.env.JWT_COOKIE_EXPIRES_IN 
    })

    //Send cookie
    const cookieOpt = {
        expires: new Date(
          Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        secure: false,
        sameSite: 'strict',
        httpOnly: true,
      };

      res.cookie('auth', token, cookieOpt);

      //remove users password
      user.password = undefined;
      
    return response(res, 200, 's200', 'logged in successfully', {token, user});
});


/**
 * @desc Middleware for protecting some routes
 * @param
 */
exports.protect = AsyncHandler(async (req, res, next) => {
    //Get token
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }else if(req.cookie.auth){
        token = req.cookie.auth;
    }

    if(!token) return next(new ErrorHandler(`You're not loggedin please log in to get access`, 200, 'e401'));

    //Verify token
    const decode = await promisify(jwt.verify)(token, process.env.JWT_PKEY);

    //Check if user still exists
    const currentUser = await User.findById(decode.id);

    if(!currentUser) return next(new ErrorHandler(`User no longer exists`, 200, 'e402'));

    //check if user changed password after the token was is issued
    if(currentUser.isPasswordChanged(decode.iat))return next(new ErrorHandler(`User recently changed password! please login again`, 200, 'e403'))

    //Grant access
    req.user = currentUser;
    next();
})

/**
 * @desc Logout
 * @param : password, email
 * @route Post /api/v1/auth/logout
 */
exports.logOut = (req, res, next) => {
    res.cookie('jwt', 'loggingout', {
      expires: new Date(Date.now() * 10 * 1000),
      httpOnly: true,
    });
    // req.logout();
  
    // res.status(200).json({ status: 'success', message: 'Logged out successfully', code: 's200' });
   return response(res, 200, 's200', 'Logged out successfully');
};


/**
 * @desc Google auth
 * @param 
 * @route Post /api/v1/auth/google
 */
exports.googleAuth = AsyncHandler(async (req, res, next)=> {
    //create send token
    const token = jwt.sign({id: req.user._id}, process.env.JWT_PKEY, {
        expiresIn: process.env.JWT_COOKIE_EXPIRES_IN 
    });

    const data = {
        token,
        user: req.user
    }
   return response(res, 200, 's200', 'Logged in with google', data)
})

exports.resetPassword = AsyncHandler((req, res, next) => {

});

exports.changePassword = AsyncHandler((req, res, next) => {

});