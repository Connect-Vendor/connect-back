const AsyncHandler = require('../utils/AsyncHandler');
const ErrorHandler = require('../utils/Errorhandler');
const response = require('../utils/response');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Vendor = require('../models/Vendor');
const { default: axios } = require('axios');


/**
 * @desc Admin Analysis controller
 * @payload 
 * @route Get /api/v1/admin/admin-analysis
 */
exports.adminAnalysis = AsyncHandler(async(req, res, next) => {
    //Get total amount made
    const paystackResponse = await axios({
        method: 'GET',
        url: `https://api.paystack.co/transaction/totals?from=${new Date().getFullYear()}&to=${new Date().getFullYear() + 1}`,
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_KEY}`
        }
    });

    // console.log('PAYSTACK RES',paystackResponse)

    //Get total service on the system
    const service_count = await Service.find({}).count();

    //Get total Customer(users) on the system
    const customer_count = await Booking.aggregate([
        {
            $group: { _id: "$user" }
        },
        {
            $group: {_id: null, count: { $sum: 1 } }
        },
    ]);

    //Get total vendors on the system
    const vendor_count = await Vendor.find().count();

    //Get total service bought
    const service_bought_count = await Booking.aggregate([
        {
            $group: { _id: "$service" }
        },
        {
            $group: {_id: null, count: { $sum: 1 } }
        },
    ]);

    //Get total reviews 

    const data = {
        service_count,
        customer_count,
        vendor_count,
        service_bought_count,
        total_transactions: paystackResponse.data.data.total_transactions,
        total_amount: paystackResponse.data.data.total_volume
    }

    //Send back response
    return response(res, 200, 's200', 'Dashboard Analysis', data);
});


/**
 * @desc Vendor Analysis controller
 * @payload 
 * @route Get /api/v1/admin/vendor-analysis
 */
exports.vendorAnalysis = AsyncHandler(async(req, res, next) => {
    //Get total transaction 
    const service_bought_count = await Booking.aggregate([
        {
            $match:{vendor:req.user._id}
        },
        {
            $group: { _id: null, total: { $sum: "$price" }, count: {$sum: 1} }
        },
    ]);

    //Get customer
    const customer_count = await Booking.aggregate([
        {
            $group: { _id: "$service" }
        },
        {
            $group: {_id: null, count: { $sum: 1 } }
        },

    ]);

    //Services created 
    const service_count = await Service.find({created_by: req.user._id}).count();

    const data={
        service_count,
        customer_count,
        service_bought_count
    }

    //return response
    return response(res, 200, 's200', 'Vendor analysis', data);

});


/**
 * @desc Vendor Analysis controller
 * @payload 
 * @route Get /api/v1/admin/vendor-analysis
 */
exports.userAnalysis = AsyncHandler(async(req, res, next)=> {
    //Services bought
    const service_count = await Booking.find({user: req.user._id}).count();

    //Total REviews
    const review_count = await Review.find({user: req.user._id}).count();

    //User Vendors
    const vendor_count = await Booking.aggregate([
        {
            $match:{user:req.user._id}
        },
        {
            $group: { _id: null, count: {$sum: 1} }
        },
    ]);
    const data = {
        service_count,
        review_count,
        vendor_count
    };
    //return response
    return response(res, 200,'s200','User analysis', data)
})