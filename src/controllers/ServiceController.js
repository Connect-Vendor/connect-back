const Service = require('../models/Service');
const response = require('../utils/response');
const ErrorHandler = require('../utils/Errorhandler');
const AsyncHandler = require('../utils/AsyncHandler');
const Vendor = require('../models/Vendor');


/**
 * @desc Create Service
 * @payload : name, price, location, description, summery, discount, bussiness_name, cover_image, images, account_details, category
 * @route POST /api/v1/service/create-service
 */

exports.createService = AsyncHandler(async (req, res, next) => {
    const {name, cover_image, images, price, description, summery, discount, category, account_details, isSublish} = req.body;

    //Check fields
    if(!name) return next(new ErrorHandler('Service name is requried', 200, 'e404'));
    if(!price) return next(new ErrorHandler('Service price is requried', 200, 'e404'))
    if(!description) return next(new ErrorHandler('Service description is required', 200, 'e404'))
    if(!summery) return next(new ErrorHandler('Summery is required', 200, 'e404'))
    if(!category) return next(new ErrorHandler('Service category is required', 200, 'e404'));
    if(!account_details) return next(new ErrorHandler('Account details is required', 200, 'e404'));

    //Check if user already have a service with similar name
    const isService = await Service.findOne({name, created_by: req.user._id});
    if(isService) return next(new ErrorHandler('You already have a service with this name please choose another name', 200, 'e401'))
    
    //Proccess and upload cover image and showcase images


    //Get vendors details
    const vendor = await Vendor.findOne({vendor_id: req.user._id});

    console.log('User',req.user)
    //Create service
    const service = await Service.create({
        name,
        price: Number(price),
        location: vendor.location,
        description,
        account_details,
        cover_image,
        category,
        images,
        summery,
        discount: discount ? discount : 0,
        business_name: vendor.business_name,
        created_by: req.user._id,
    });

    //Publish Service on social platform
    if(isSublish){
        console.log('Published online');
    }
    
    //Send success response
    return response(res, 200, 's200', 'Service successfully created', service);

});


/**
 * @desc Edit Service
 * @payload : name, price, location, description, summery, discount
 * @route PUT /api/v1/service/edit-service/:id
 */

exports.editService = AsyncHandler(async (req, res, next) => {
    const {id} = req.params;
    const {name, price, location, description, summery, discount} = req.body;

    //Validate fields
    if(!name) return next(new ErrorHandler('Service name is requried', 200, 'e404'));
    if(!price) return next(new ErrorHandler('Service price is requried', 200, 'e404'))
    if(!location) return next(new ErrorHandler('Location is required', 200, 'e404'))
    if(!description) return next(new ErrorHandler('Service description is required', 200, 'e404'))
    if(!summery) return next(new ErrorHandler('Summery is required', 200, 'e404'));

    //check if service exists
    const isService = await Service.findOne({_id: id, created_by: req.user._id});

    if(!isService) return next(new ErrorHandler('You cant edit this service', 200, 'e404'));

    //Update service 
    const service = await Service.findOneAndUpdate({_id: id, created_by: req.user._id}, {
        name, price, location, description, summery
    });

    response(res, 200, 's200', 'Service is updated successfully', service);

});


/**
 * @desc Delete Services
 * @param : id
 * @route DELETE /api/v1/service/:id
 */
exports.deleteService = AsyncHandler(async (req, res, next) => {
    const {id} = req.params;

    if(!id) return next(new ErrorHandler('Service ID is required', 200, 'e404'));

    //check is if user is super admin
    if(req.user.role === 'super-admin'){
        await Service.updateOne({_id: id}, {status: 0});
    }else{
        //Check if service exists
        const isService = await Service.findOne({_id: id, created_by: req.user._id});
    
        if(!isService) return next(new ErrorHandler('You can not delete this service', 200, 'e404'));
    
        //Update status to 0 i.e not active or deleted
        await Service.updateOne({_id: id}, {status: 0});
    }


    response(res, 200, 's200', 'Service deleted successfully');
});


/**
 * @desc Get all service by vendor
 * @param :vendor_id
 * @route GET /api/v1/service/vendor/:vendor_id
 */

exports.getAllServiceByVendor = AsyncHandler(async (req, res, next) => {
    const {vendor_id} = req.params;

    const limit = +req.query.limit || 5;
    delete req.query.limit;
    const page = +req.query.page || 1;
    delete req.query.page;
    const skip = (page -1) * limit;
    
    
    //Validate input fields
    if(!vendor_id) return next(new ErrorHandler('Vendor ID is required', 200, 'e404'));
    
    //paginate
    const services = await Service.find({created_by: vendor_id}).limit(limit).skip(skip).sort({date_created: 'asc'}).populate('created_by');

    if(services.length == 0) return next(new ErrorHandler('No service has been created by this vendor', 200, 'e402'));

    //REturn service
    return response(res, 200, 's200', 'Services', services);
});


/**
 * @desc Get Service
 * @param :id
 * @route GET /api/v1/service/:id
 */
exports.getService = AsyncHandler(async (req, res, next) => {
    const {id} = req.params;

    if(!id) return next(new ErrorHandler('Service ID is required', 200, 'e404'));

    const service = await Service.findOne({_id: id}).populate('created_by');

    if(!service) return next(new ErrorHandler('Service not found', 200, 'e404'));

    return response(res, 200, 's200', 'Service fetched', service);
});


/**
 * @desc Get All Service
 * @param :null
 * @payload null
 * @route GET /api/v1/service/
 */

exports.getAllService = AsyncHandler(async (req, res, next) => {
    let query;
    const limit = +req.query.limit || 5;
    delete req.query.limit;
    const page = +req.query.page || 1;
    delete req.query.page;
    const skip = (page -1) * limit;
    
    
    //check if there's query
    if(req.query){
        query = req.query;
    }

    //paginate
    console.log(query)
    const services = await Service.find(query).limit(limit).skip(skip).sort({date_created: 'asc'}).populate('created_by');


    if(services.length == 0) return next(new ErrorHandler('No services', 200, 'e404'));

    //return response
    response(res, 200, 's200', 'Services', services);
    
})
