const axios = require('axios').default;
const Account = require('../models/BankDetails');
const Vendor = require('../models/Vendor');
const Service = require('../models/Service');
const AsyncHandler = require('../utils/AsyncHandler');
const ErrorHandler = require('../utils/Errorhandler');
const response = require('../utils/response');


/**
 * @desc Create Subacount
 * @payload : account_number, bank_code, owner, account_name
 * @route Post /api/v1/payment/create-sub-account
 */
exports.addAccount = AsyncHandler(async (req, res, next) => {
    const {account_number, bank_code, account_name,}   = req.body;

    //Verify input
    if(!account_number) return next(new ErrorHandler('Account Number is required', 'e404'));
    if(!bank_code) return next(new ErrorHandler('Bank code is required', 'e404'));
    if(!account_name) return next(new ErrorHandler('Account name is required', 'e404'));

    //Check if subaccount exists
    const isSubAccount = await Account.findOne({account_number, owner: req.user._id});

    if(isSubAccount) return response(res, 200, 'e401', 'Account number already exist. Use it instead', isSubAccount);

    //Find Vendor
    const vendor = await Vendor.findOne({vendor_id: req.user._id});

    //Paystack payload
    const data = {
        business_name: vendor.business_name,
        bank_code,
        percentage_charge: 5,
        account_number
    }
    //Create sub acount with paystack
    const paystackResponse = await axios({
        url: 'https://api.paystack.co/subaccount',
        method: 'POST',
        headers: {
           Authorization: `Bearer ${process.env.PAYSTACK_KEY}`,
           'Content-Type': 'application/json'
        },
        data: JSON.stringify(data)
    });

    console.log(paystackResponse.data.data);

    //Create sub account on db
    const newSubAccount = await Account.create({
        bank_name: paystackResponse.data.data.settlement_bank,
        account_number: paystackResponse.data.data.account_number,
        bank_code,
        account_code: paystackResponse.data.data.subaccount_code,
        account_name,
        owner: req.user._id
    });

    //Return response
    response(res, 200, 's200', 'Sub account created successfully', newSubAccount);
});

exports.getAccount = AsyncHandler(async(req, res, next) => {

});

exports.updateAccount = AsyncHandler(async(req, res, next) => {

});

exports.removeAccount = AsyncHandler(async(req, res,next) => {

})

exports.fetchVendorsAccounts = AsyncHandler(async (req, res, next) => {

});

exports.verifyAccountNumber = AsyncHandler(async (req, res, next) => {

});



/**
 * @desc Purchase service
 * @payload 
 * @params :service_id
 * @route Post /api/v1/payment/initialize-payment
 */
exports.checkoutService = AsyncHandler(async (req, res, next) => {

    const {service_id} = req.params;

    //check fileds
    if(!service_id) return next(new ErrorHandler('Serice is required', 200, 'e404'));

    //Get service
    const service = await Service.findOne({_id: service_id}).populate('created_by');

    //Get Vendor
    const vendorAcc = await Account.findOne({owner: service.created_by._id});

    //Build data
    const data = {
        amount: service.price * 100,
        email: req.user.email,
        subaccount: vendorAcc.subaccount_code,
        metadata: {service_id, user: req.user._id},
        callback_url: `http://localhost:3500/veryfy-payment`

    }

    //Initilaize Payment
    const paystackResponse = await axios({
        url: 'https://api.paystack.co/transaction/initialize',
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_KEY}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(data)
    })

    //Send back response
    return response(res, 200, 's200', 'Payment initialized', paystackResponse.data.data);

});


exports.verifyPayment = AsyncHandler(async (req, res, next) => {
    const {reference} = req.query;

    const paystackResponse = await axios({
        method: 'GET',
        url: `https://api.paystack.co/transaction/verify/${reference}`,
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_KEY}`
        }
    });

    console.log(paystackResponse);

    response(res, 200, 's200', 'You successfully purchased')
});

