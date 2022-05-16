const sharp = require('sharp');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const ErrorHandler= require('../utils/Errorhandler');
const response = require('../utils/response');
const AsyncHandler = require('../utils/AsyncHandler');


/**
 * @param :user_id
 * @desc Get user
 * @route GET /api/v1/user/get-user/:user_id
 */
exports.getUser = AsyncHandler(async (req, res, next) => {
    const {user_id} = req.params;
    //check if user exists
    const user = await User.findOne({_id: user_id, acitve: true});

    if(!user) return next(new ErrorHandler('User not found', 200, 'e404'));

    //return user
    response(res, 200, 's200', 'User', user);
});


/**
 * @param :user_id
 * @desc Get Me
 * @route GET /api/v1/user/get-me
 */

exports.getMe=AsyncHandler(async (req, res, next) => {
    const user = await User.findOne({_id: req.user._id});

    //Check if user exists
    if(!user) return next(new ErrorHandler('User not found', 200, 'e404'));

    //return response
    response(res, 200, 's200', 'User', user);
});


/**
 * @param 
 * @payload first_name, last_name, phone, email
 * @desc Get Me
 * @route PUT /api/v1/user/update-me
 */
exports.updateMe = AsyncHandler(async (req, res, next) => {
    const {first_name, last_name, phone, email} = req.body;

    if(!first_name)return next(new ErrorHandler('First name is required', 200, 'e404'));
    if(!last_name)return next(new ErrorHandler('Last name is required', 200, 'e404'));
    if(!email)return next(new ErrorHandler('Email is required', 200, 'e404'));
    
        //Validate Email
        const regex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

        if (!regex.test(email)) return next(new ErrorHandler('Email address is not valid', 200, 'e402'));

    //Check if user exists
    const user = await User.findOne({_id: req.user._id, acitve: true});

    if(!user) return next(new ErrorHandler('User not found', 200, 'e404'));

    //update user info
    user.email = email;
    user.first_name = first_name;
    user.last_name = last_name;
    user.phone = phone

    const updatedUser = await user.save();

    //Return response
    response(res, 200, 's200', 'User updated successfully', updatedUser);
})


/**
 * @desc Change profile picture
 * @payload file image
 * @route /api/v1/users/update-profile-picture
 */

exports.changeProfilePicture = AsyncHandler(async (req, res, next) => {
    console.log(req.file);
    if(!req.file) return next(new ErrorHandler('Please choose a picture to upload', 200, 'e404'));

    const user = await User.findOne({_id: req.user._id});

    //Get perivous photo
    const pre_image = user.photo;

    const path = `public/users/user-${req.user._id}-${uuidv4()}.jpeg`;

    //update user photo
    await sharp(req.file.buffer).toFormat('jpeg').jpeg({quality: 90}).toFile(path);
    user.photo = path;
    await user.save();

    if(!pre_image.includes('default')){
        //remove previous image
        fs.rmSync(pre_image);
    }

    //return response
    return response(res, 200, 's200', 'Profile picture successfully update');
});