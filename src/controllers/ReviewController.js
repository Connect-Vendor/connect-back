const Review = require('../models/Review');
const AsyncHandler = require('../utils/AsyncHandler');
const response = require('../utils/response');
const ErrorHandler = require('../utils/Errorhandler');


/**
 * @desc Create Review
 * @payload : review, rating, service
 * @route Post /api/v1/review/create-review
 */
exports.createReview = AsyncHandler(async ( req, res, next) => {
    const {review,
        rating,
        service
        } = req.body;

        //Validate input filed
    if(!review) return next(new ErrorHandler('Review is required', 200, 'e404'));
    if(!rating) return next(new ErrorHandler('Rating is required', 200, 'e404'));
    if(!service) return next(new ErrorHandler('Service is required', 200, 'e404'));


    //Check is a user has already reviewed a service
    const isReview = await Review.findOne({user: req.user._id, service});

    if(isReview) {
        return next(new ErrorHandler('You have reivew this service already', 200, 'e401'))
    }

    //Create review
    const newReview = await Review.create({
        review,
        rating,
        user: req.user._id,
        service
    })

    //Return response
    return response(res, 200, 's200', 'Thanks for review this service', newReview);
});


/**
 * @desc Edit review
 * @payload :review, rating, user, service
 * @route PUT /api/v1/review/edit-review
 */
 exports.editReview = AsyncHandler(async(req, res, next) => {
    const {review, rating, service} = req.body;
    
    //Check fields
      //Validate input filed
      if(!review) return next(new ErrorHandler('Review is required', 200, 'e404'));
      if(!rating) return next(new ErrorHandler('Rating is required', 200, 'e404'));
      if(!service) return next(new ErrorHandler('Service is required', 200, 'e404'));

      const isReview = await Review.findOn({user: req.user, service});

      if(!isReview) return next(new ErrorHandler('Review no found', 200, 'e404'));
      
      isReview.rating = rating;
      isReview.service = service;
      isReview.review = review

    const updatedReview = await Review.findOneAndUpdate({user: req.user, service}, {review, rating, service});

    return response(res, 200, 's200', 'Review updated successfully', updatedReview);

    
});


/**
 * @desc Delete review
 * @payload : id
 * @route Delete /api/v1/review/:id
 */
exports.deleteReview = AsyncHandler(async (req, res, next) => {
    const {id} = req.params;

    //Check fields
    if(!id) return next(new ErrorHandler('Review id is required', 200, 'e404'));

    await Review.updateOne({_id: id}, {status: 0});

    return response(res, 200, 's200', 'Review successfully deleted');
});


/**
 * @desc Get a review
 * @payload : id
 * @route GET /api/v1/review/:id
 */
exports.getReview = AsyncHandler(async (req, res, next) => {
    const {id} = req.params;

    //Check field
    if(!id) return next(new ErrorHandler('Review id is required', 200, 'e404'));

    const review = await Review.findOne({_id: id});

    return response(res, 200, 's200', 'Review', review)
})


/**
 * @desc Get all reviews by user
 * @payload : user, service
 * @route GET /api/v1/review/:user/:service
 */
exports.getReviews = AsyncHandler(async (req, res, next) => {
    const {user, service} = req.params;

    if(!user) return next(new ErrorHandler('User required', 200, 'e404'));

    if(!service) return next(new ErrorHandler('Service required', 200, 'e404'));

    const reviews= await Review.find({user, service});

    if(reviews.length === 0) return response(res, 200, 's403', 'No reviews from this user')

    return response(res, 200, 's200', 'Reviews', reviews);
});


/**
 * @desc Get all reviews
 * @payload : service
 * @route GET /api/v1/review/:service
 */
exports.getAllReviews = AsyncHandler(async (req, res, next) => {
    const {service} = req.params;

    if(!service) return next(new ErrorHandler('Service required', 200, 'e404'));

    const reviews = await Review.find({service});

    if(reviews.length === 0) return response(res, 200, 's403', 'No reviews for this service yet');

    return response(res, 200, 's200', 'Reviews', reviews);
})



