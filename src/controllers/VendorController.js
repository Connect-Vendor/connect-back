const Vendor = require('../models/Vendor');
const AsyncHandler = require('../utils/AsyncHandler');
const ErrorHandler = require('../utils/Errorhandler');
const { v4: uuidv4 } = require('uuid');
const response = require('../utils/response');


/**
 * @desc Create Vendor
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
    const isVendor = await Vendor.findOne({business_name});

    if(isVendor) return next(new ErrorHandler('Business name already exists', 200, 'e402'));

    //create Vendor
   const vendor = await Vendor.create({
        accounts,
        vendor_id: req.user._id,
        vendor_code: uuidv4(),
        business_name,
        business_logo: logo ? logo : 'public/images/logo.png',
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
 * @payload : accounts, business_name, location, phone, description, business_logo
 * @route Post /api/v1/vendor/create-vendor
 */
exports.getVendor = AsyncHandler()


/**
 * @desc Create Review
 * @payload : accounts, business_name, location, phone, description, business_logo
 * @route Post /api/v1/vendor/create-vendor
 */
exports.getAllVendor = AsyncHandler()

