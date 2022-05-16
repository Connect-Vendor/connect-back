const sharp = require('sharp');
const fs = require('fs');
const Vendor = require('../models/Vendor');
const AsyncHandler = require('../utils/AsyncHandler');
const ErrorHandler = require('../utils/Errorhandler');
const { v4: uuidv4 } = require('uuid');
const response = require('../utils/response');


/**
 * @desc Create Vendor / Upgrade to Vendor
 * @payload : accounts, business_name, location, phone, description, business_logo
 * @route Post /api/v1/vendor/create-vendor
 */
exports.createVendor = AsyncHandler(async(req, res, next) => {
    const {accounts, business_name, location, phone, description, logo} = req.body;

    //Validate fields
    if(!accounts) return next(new ErrorHandler('Account details is required', 200, 'e404'));
    if(!business_name) return next(new ErrorHandler('Business Name is required', 200, 'e404'));
    if(!location) return next(new ErrorHandler('Business location is required', 200, 'e404'));
    if(!phone) return next(new ErrorHandler('Phone Number is required', 200, 'e404'));
    if(!description) return next(new ErrorHandler('Business description is required', 200, 'e404'));

    //Check is vendor business name exists
    // const isVendor = await Vendor.findOne({business_name});

    // if(isVendor) return next(new ErrorHandler('Business name already exists', 200, 'e402'));

    //create Vendor
   const vendor = await Vendor.create({
        accounts,
        vendor_id: req.user._id,
        vendor_code: uuidv4(),
        business_name,
        business_logo: logo ? logo : 'public/vendors/logo.png',
        phone,
        description,
        location
    });

    response(res, 200, 's200', 'Vendor is created successfully', vendor);
});


/**
 * @desc Deactivate vendor
 * @payload : 
 * @route Post /api/v1/vendor/create-vendor
 */
exports.deactivateVendor = AsyncHandler()


/**
 * @desc Create Review
 * @payload : accounts, business_name, location, phone, description, business_logo
 * @route Post /api/v1/vendor/create-vendor
 */
exports.editVendor = AsyncHandler()


/**
 * @desc Create Review
 * @payload : 
 * @parma :id
 * @route GET /api/v1/vendor/get-vendor/:id
 */
exports.getVendor = AsyncHandler(async (req, res, next) => {
    const {id} = req.params;

    const vendor = await Vendor.findOne({_id: id}).populate('vendor_id');

    if(!vendor) return next(new ErrorHandler('Vendor not found', 200, 'e404'));

    //return response
    return response(res, 200, 's200', 'Vendor', vendor);
});


/**
 * @desc Create Review
 * @payload : accounts, business_name, location, phone, description, business_logo
 * @route Post /api/v1/vendor/create-vendor
 */
exports.getAllVendor = AsyncHandler()


/**
 * @desc Create Review
 * @payload : accounts, business_name, location, phone, description, business_logo
 * @route Post /api/v1/vendor/create-vendor
 */
exports.upgradeToVendor = AsyncHandler()

/**
 * @desc change business logo
 * @param :id
 * @payload image file
 * @route POST api/v1/vendor/change-logo/:id
 */
exports.changeLogo  = AsyncHandler(async (req, res, next) => {
    const {id} = req.params;
    if(!req.file) return next(new ErrorHandler('Please choose a picture to upload', 200, 'e404'));

    const vendor = await Vendor.findOne({_id: id, vendor_id: req.user._id});
    console.log(vendor);
    //Get perivous photo
    const pre_image = vendor.business_logo;

    const path = `public/vendors/vendor-${vendor.business_name.split(' ').join('_')}-${uuidv4()}.jpeg`;

    //update user photo
    await sharp(req.file.buffer).toFormat('jpeg').jpeg({quality: 90}).toFile(path);
    vendor.business_logo = path;
    await vendor.save();

    console.log('Previous image path', pre_image);
    //remove previous image
    if(!pre_image.includes('default')){
        const deletedFil = fs.rmSync(pre_image);
        console.log(deletedFil);
    }

    //return response
    return response(res, 200, 's200', 'Profile picture successfully update');
})

