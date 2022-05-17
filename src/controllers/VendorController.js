const sharp = require('sharp');
const fs = require('fs');
const Vendor = require('../models/Vendor');
const User = require('../models/User');
const AsyncHandler = require('../utils/AsyncHandler');
const ErrorHandler = require('../utils/Errorhandler');
const { v4: uuidv4 } = require('uuid');
const response = require('../utils/response');
const { vendor } = require('sharp');


/**
 * @desc Create Vendor / Upgrade to Vendor
 * @payload :business_name, location, phone, description, business_logo
 * @route Post /api/v1/vendor/create-vendor
 */
exports.createVendor = AsyncHandler(async(req, res, next) => {
    const {business_name, location, phone, description, logo} = req.body;

    console.log(req.body);

    //Validate fields
    if(!business_name) return next(new ErrorHandler('Business Name is required', 200, 'e404'));
    if(!location) return next(new ErrorHandler('Business location is required', 200, 'e404'));
    if(!phone) return next(new ErrorHandler('Phone Number is required', 200, 'e404'));
    if(!description) return next(new ErrorHandler('Business description is required', 200, 'e404'));

    //Check is vendor business name exists
    // const isVendor = await Vendor.findOne({business_name});

    // if(isVendor) return next(new ErrorHandler('Business name already exists', 200, 'e402'));

    //create Vendor
   const vendor = await Vendor.create({
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
 * @params :id
 * @route Delete /api/v1/vendor/diactivate-vendor/:id
 */
exports.deactivateVendor = AsyncHandler(async (req, res, next) => {
    const {id} = req.params;

    //check if user is authorized
    const vendorData = await Vendor.findOne({_id: id, vendor_id: req.user._id});
    if(req.user.role === 'admin' && vendorData){
        await Vendor.updateOne({_id: id}, {status: 0});
        return response(res, 200, 's200', 'Vendor diactivated successfully');
    }else if(req.user.role === 'admin' && !vendorData){
        return next(new ErrorHandler("You're not authorized to delete another vendor", 200,'e400'));
    }else{
        console.log('ADMIN')
        //update vendor status to 0
        await Vendor.updateOne({_id: id}, {status: 0});
        //Send bank response
        return response(res, 200, 's200', 'Vendor diactivated successfully');
    }
    
})


/**
 * @desc Edit Review
 * @payload : business_name, location, phone, description
 * @route PUT /api/v1/vendor/edit-vendor/
 */
exports.editVendor = AsyncHandler(async (req, res, next) => {
    const {business_name, location, phone, description} = req.body;

    if(!business_name) return next(new ErrorHandler('Business name is required', 200, 'e404'));
    if(!location) return next(new ErrorHandler('Location is required', 200, 'e404'));
    if(!phone) return next(new ErrorHandler('Phone is required', 200, 'e404'));
    if(!description) return next(new ErrorHandler('Description is required', 200, 'e404'));

    //Check if vendor exists
    const vendor = await Vendor.findOne({vendor_id: req.user._id, _id: req.params.id});

    if(!vendor) return next(new ErrorHandler('You are not authorized to perform this action', 200, 'e404'));

    //update vendor
    const updatedVendor = await Vendor.findOneAndUpdate({_id: req.params.id}, {
        business_name,
        location,
        phone,
        description
    }).populate('vendor_id');

    return response(res, 200, 's200', 'Vendor edited successfully', updatedVendor);

})


/**
 * @desc Get Vendor
 * @payload : 
 * @parma :id
 * @route GET /api/v1/vendor/get-vendor/:id
 */
exports.getVendor = AsyncHandler(async (req, res, next) => {
    const {id} = req.params;

    const vendor = await Vendor.findOne({_id: id, status: 1}).populate('vendor_id');

    if(!vendor) return next(new ErrorHandler('Vendor not found', 200, 'e404'));

    //return response
    return response(res, 200, 's200', 'Vendor', vendor);
});


/**
 * @desc Get all vendors
 * @payload 
 * @route Get /api/v1/vendor/fetch-vendors
 */
exports.getAllVendor = AsyncHandler(async (req, res, next) => {
    const limit = +req.query.limit || 20;
    delete req.query.limit;
    const page = +req.query.page || 1;
    delete req.query.page;
    const skip = (page -1) * limit;
    
    //paginate
    const vendors = await Vendor.find({}).limit(limit).skip(skip).sort({date_created: 'asc'}).populate('vendor_id');

    if(vendors.length === 0) return next(new ErrorHandler('No vendor created in the system yet', 200, 'e404'));

    //returne response
    return response(res, 200, 's200', 'Vendors', vendors);

});


/**
 * @desc Upgrade to Vendor
 * @payload :
 * @route Post /api/v1/vendor/upgrade
 */
exports.upgradeToVendor = AsyncHandler(async (req, res, next) => {
    const {business_name, location, phone, description, logo} = req.body;

    //Validate fields
    if(!business_name) return next(new ErrorHandler('Business Name is required', 200, 'e404'));
    if(!location) return next(new ErrorHandler('Business location is required', 200, 'e404'));
    if(!phone) return next(new ErrorHandler('Phone Number is required', 200, 'e404'));
    if(!description) return next(new ErrorHandler('Business description is required', 200, 'e404'));

    //update users role to admin
    await User.updateOne({_id: req.user._id}, {role: 'admin'})


    //create Vendor
   const vendor = await Vendor.create({
        vendor_id: req.user._id,
        vendor_code: uuidv4(),
        business_name,
        business_logo: logo ? logo : 'public/vendors/logo.png',
        phone,
        description,
        location
    });

    response(res, 200, 's200', 'Vendor is created successfully', vendor);

})

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

