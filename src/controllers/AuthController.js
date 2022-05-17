const User = require('../models/User');
const crypto = require('crypto');
const AsyncHandler = require("../utils/AsyncHandler");
const ErrorHandler = require("../utils/Errorhandler");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const response = require("../utils/response");
const Email = require('../utils/EmailUtil');
// const { promisify } = require('util');


/**
 * @desc Signup a user
 * @payload : first_name, last_name, password, email, phone
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

    if (!role) {
        userRole = 'user'
    } else {
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
    console.log('JWT CHECK', process.env.JWT_EXPIRATION)
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_PKEY, {
        expiresIn: Number(process.env.JWT_EXPIRATION),
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

    return response(res, 200, 's200', 'User created successfully', { token, user: newUser });

});


/**
 * @desc Login a user
 * @payload : password, email
 * @route Post /api/v1/auth/login
 */
exports.login = AsyncHandler(async (req, res, next) => {
    //Get user login creadientials
    const { password, email } = req.body;

    if (!password) return next(new ErrorHandler('Password is require', 200, 'e404'));

    if (!email) return next(new ErrorHandler('Email is require', 200, 'e404'));

    //Check is user exist
    const user = await User.findOne({ email, active: true }).select('+password');
    // console.log('Email', user);
    if (!user || !(await user.isPasswordCorrect(password, user.password))) return next(new ErrorHandler('Incorrect email or password', 200, 'e401'));


    //create send token
    const token = jwt.sign({ id: user._id }, process.env.JWT_PKEY, {
        expiresIn: process.env.JWT_EXPIRATION,
        // algorithm: 'HS256'
    });

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

    return response(res, 200, 's200', 'logged in successfully', { token, user });
});


/**
 * @desc Middleware for protecting some routes
 * @payload
 */
exports.protect = AsyncHandler(async (req, res, next) => {
    //Get token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        console.log('TOKEN', token);
    } else if (req.cookie && req.cookie.auth) {
        token = req.cookie.auth;
    }

    if (!token) return next(new ErrorHandler(`You're not loggedin please log in to get access`, 200, 'e401'));

    //Verify token
    const decode = jwt.verify(token, process.env.JWT_PKEY);
    // console.log('DECODED', decode)

    //Check if user still exists
    const currentUser = await User.findById(decode.id);

    if (!currentUser) return next(new ErrorHandler(`User no longer exists`, 200, 'e402'));

    //check if user changed password after the token was is issued
    if (currentUser.isPasswordChanged(decode.iat)) return next(new ErrorHandler(`User recently changed password! please login again`, 200, 'e403'))

    //Grant access
    req.user = currentUser;
    next();
})

/**
 * @desc Logout
 * @payload : password, email
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
 * @payload 
 * @route Post /api/v1/auth/google
 */
exports.googleAuth = AsyncHandler(async (req, res, next) => {
    //create send token
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_PKEY, {
        expiresIn: process.env.JWT_COOKIE_EXPIRES_IN
    });

    const data = {
        token,
        user: req.user
    }
    return response(res, 200, 's200', 'Logged in with google', data)
})


exports.restrictTo =
    (...roles) =>
        (req, res, next) => {
            // console.log('USER',req.user);
            if (!roles.includes(req.user.role))
                return next(
                    new ErrorHandler('You do not have access to perform this action', 403, 'e400')
                );

            next();
        };



exports.resetPassword = AsyncHandler(async (req, res, next) => {
    const {token} = req.params;
    const {password} = req.body;

    //hash token
    const hashToken = crypto.createHash('sha256').update(token).digest('hex');

    //check if token is still valid
     const user = await User.findOne({password_reset_expires: {$gt: Date.now()} , password_reset_token: hashToken});

    if(!user) return next(new ErrorHandler('Invalid or expired token', 200, 'e400'));

    //update user crediential
    const hash_password = bcrypt.sign(password, 12);
    user.password_reset_expires = undefined;
    user.password_reset_token=undefined;
    user.password = hash_password;
    await user.save();

    // create send token
    const new_token = jwt.sign({ id: user._id }, process.env.JWT_PKEY, {
        expiresIn: process.env.JWT_EXPIRATION,
        // algorithm: 'HS256'
    });

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

    return response(res, 200, 's200', 'Password changed successfully', {user, token: new_token});

});


/**
 * @desc Change Password
 * @payload password, current_password
 * @route PATCH /api/v1/users/change-password
 */
exports.changePassword = AsyncHandler(async (req, res, next) => {
    //Get user 
    const {password, current_password} = req.body;
    const user = await User.findOne({_id: req.user._id, active: true}).select('+password');
    if(!user) return next(new ErrorHandler('User not found', 200, 'e404'));

    //compare password
    const password_hash = await bcrypt.hash(password, 12);

    if(!(await bcrypt.compare(current_password, user.password))) return next(new ErrorHandler('Current password is incorrect', 200, 'e400'));

    //update users password
    user.password = password_hash;
    const updatedUser = await user.save();

    response(res, 200, 's200', 'Password updated successfully', updatedUser);
});


/**
 * @desc Password reset
 * @params
 * @payload email
 * @route /api/v1/auth/forget-password
 */
exports.forgotPassword = async (req, res, next) => {
    //Get email
    const { email } = req.body;
    if (!email) return next(new ErrorHandler('Email is required', 200, 'e404'));

    //check if user exists
    const user = await User.findOne({ email });
    if (!user) return next(new ErrorHandler('User not found', 200, 'e404'));

    try {
        //Generate a randome reset token
        const token = crypto.randomBytes(32).toString('hex');
        //update password reset token and time resetted
        user.password_reset_token = crypto.createHash('sha256').update(token).digest('hex');
        user.password_reset_expires = Date.now() + 10 * 60 * 1000

        await user.save({ validateBeforeSave: false });

        //Send reset email
        const url = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpasswor/${token}`;
        await new Email(user, url).sendResetPassword();

        return response(res, 200, 's200', 'Reset token sent to email');

    } catch (error) {
        user.password_reset_expires = undefined;
        user.password_reset_token = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler('Error occured sending reset email', 200, 'e501'))
    }

};