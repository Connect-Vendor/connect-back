const axios = require('axios').default;
const Account = require('../models/BankDetails');
const Vendor = require('../models/Vendor');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
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

    if(isSubAccount) return response(res, 200, 'e401', 'Account number already exist', isSubAccount);

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

    //Create a splilt account
    // const splitData = {
    //     name: `${vendor.business_name}`,
    //     type: 'percentage',
    //     currency: 'NGN',
    //     subaccounts: [{subaccount: paystackResponse.data.data.subaccount_code, share: 95}],
    // }

    // const paystackSplitResponse = await axios({
    //     url: 'https://api.paystack.co/split',
    //     method: 'POST',
    //     headers: {
    //         Authorization: `Bearer ${process.env.PAYSTACK_KEY}`,
    //         'Content-Type': 'application/json'
    //     },
    //     data: JSON.stringify(splitData)
    // })

    // console.log(paystackSplitResponse.data.data);

    //Create sub account on db
    const newSubAccount = await Account.create({
        bank_name: paystackResponse.data.data.settlement_bank,
        account_number: paystackResponse.data.data.account_number,
        bank_code,
        // split_code: paystackSplitResponse.data.data.split_code,
        account_code: paystackResponse.data.data.subaccount_code,
        account_name,
        owner: req.user._id
    });

    //Return response
    response(res, 200, 's200', 'Sub account created successfully', newSubAccount);
});

/**
 * @desc Get an account
 * @params account_code
 * @route GET /api/v1/payment/subaccount/:account_code
 */
exports.getAccount = AsyncHandler(async(req, res, next) => {
    const {account_code} = req.params;
    
    //check if Account is in paystack
   const paystackResponse = await axios({
        url: `https://api.paystack.co/subaccount/${account_code}`,
        method: "GET",
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_KEY}`
        }
    });

    //if Account exists then fetch accont from db
    if(paystackResponse){
        const account = await Account.findOne({account_code});

        return response(res, 200, 's200', 'Accunt details fetched successfully', account);
    }else{
        return response(res, 200, 'e404', 'Account not found')
    }

});


/**
 * @desc Update account number
 * @params : account_code
 * @payload : account_number, bank_code
 * @route PUT /api/v1/payment/subaccount/:account_code
 */
exports.updateAccount = AsyncHandler(async(req, res, next) => {
    const {account_code} = req.params;
    const {account_number, bank_code} = req.body;

    //Validate payload
    if(!account_number) return next(new ErrorHandler('Account number is required', 200, 'e404'));
    if(!bank_code) return next(new ErrorHandler('Bank code is required', 200, 'e404'));

    //Check if account exists on system
    const vendorAccount = await Account.findOne({account_code, owner: req.user._id});
    if(!vendorAccount)return next(new ErrorHandler('Account not found', 200, 'e404'));

    //Update account on paystack first then on our system
    const data= {
        settlement_bank: bank_code,
        account_number,
    }
    //Update paystack account
    const paystackResponse = await axios({
        method: 'PUT',
        url: `https://api.paystack.co/subaccount/${account_code}`,
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_KEY}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(data)
    })

    //Update our own account if paystack updated successfully
    if(paystackResponse.data.status){
        vendorAccount.account_number = account_number;
        vendorAccount.bank_code = bank_code;
        vendorAccount.bank_nam = paystackResponse.data.data.settlement_bank;
        const updatedAccount =  await vendorAccount.save();

       return response(res, 200, 's200', 'Business account updated successfully', updatedAccount);
    }
});


/**
 * @desc Delete Account
 * @params account_code
 * @route /api/v1/payment/delete-account/:account_code
 */
exports.toggleAccountStatus = AsyncHandler(async(req, res,next) => {
    const {account_code} = req.params;

    //check if account exists
    const account = await Account.findOne({owner: req.user._id, account_code }).populate('owner');

    if(!account) return next(new ErrorHandler('Account not found', 200, 'e404'));

    //Diactivate account on paystack's side
   const paystackResponse = await axios({
        method: 'PUT',
        url: `https://api.paystack.co/subaccount/${account_code}`,
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_KEY}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({active: false})
    })

    if(paystackResponse.data.statu){
        const updatedAccount = await Account.updateOne({account_code}, {status: 0});

        return response(res, 200, 's200', 'Account updated successfully', updatedAccount);
    }

});


/**
 * @desc Fetch vendors accounts
 * @payload
 * @route GET /api/v1/payment/get-vendor-accounts/:vendor_id
 */
exports.fetchVendorsAccounts = AsyncHandler(async (req, res, next) => {
    const {vendor_id} = req.params;

     const limit = +req.query.limit || 5;
     delete req.query.limit;
     const page = +req.query.page || 1;
     delete req.query.page;
     const skip = (page -1) * limit;

    //fetch accounts
    const accounts = await Account.find({owner: vendor_id}).limit(limit).skip(skip).sort({date_created: 'asc'}).populate('owner');

    if(accounts.length === 0) return next(new ErrorHandler('Vendors accounts not found', 200, 'e404'));

   return response(res, 200, 's200', 'Vendors accounts', accounts);
});


/**
 * @desc Verify account number
 * @parmas : bank_code, account_number
 * @route GET /api/v1/payment/verify-acc?account_number=account_number&bank_code=bank_code
 */
exports.verifyAccountNumber = AsyncHandler(async (req, res, next) => {
    let bank_code;
    let account_number;
    if(req.method === 'GET'){
        bank_code = req.params.bank_code;
        account_number = req.params.account_number;   
    }else{
        account_number = req.body.account_number;
        bank_code = req.body.bank_code;
    }

    //Verify account number with paystack
    axios({
        method: 'GET',
        url: `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_KEY}`
        }
    }).then(resData => {
        if(req.method === 'GET') return  response(res, 200, 's200', 'Account resolved', {...resData.data.data});

        next();
    }).catch(error => {
        // console.log(error)
       return next(new ErrorHandler("Can't resolve account number", 200, 'e501'));
    })
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

    // console.log(vendorAcc);

    //Build data
    const data = {
        amount: service.price * 100,
        email: req.user.email,
        subaccount: vendorAcc.account_code,
        channel: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer'],
        metadata: {service_id, vendor: service.created_by._id, user: req.user._id},
        callback_url: `http://localhost:3500/api/v1/payment/verify-payment`
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

    // console.log(paystackResponse.data.data);

    //Send back response
    return response(res, 200, 's200', 'Payment initialized', paystackResponse.data.data);

});


/**
 * @desc Verify if payment is successful
 * @route /api/v1/payment/verify-payment
 */
exports.verifyPayment = AsyncHandler(async (req, res, next) => {
    const {reference} = req.query;

    //Verify payment
    const paystackResponse = await axios({
        method: 'GET',
        url: `https://api.paystack.co/transaction/verify/${reference}`,
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    //Check if payment was successful
    if(paystackResponse.data.status){
        // console.log(paystackResponse.data.data)
        //Create booking
        const data = paystackResponse.data.data;
        const booking = await Booking.create({
            user: data.metadata.user,
            service: data.metadata.service_id,
            price: data.amount,
            vendor: data.metadata.vendor,
            payment_reference: reference,
            paid: true
        });

        response(res, 200, 's200', 'You successfully purchased', booking);

    }else{
        next(new ErrorHandler('Error verifying payment', 200, 'e502'))
    }

});

