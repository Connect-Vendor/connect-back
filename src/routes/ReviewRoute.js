const router = require('express').Router();
const { createReview, editReview,
    deleteReview,
    getReview,
    getReviews,
    getAllReviews } = require('../controllers/ReviewController');

const { protect, restrictTo } = require('../controllers/AuthController');

router.use(protect);

router.post('/create-review', protect, restrictTo('user'), createReview);
router.get('/:id', getReview);
router.get('/:service', restrictTo('admin', 'super-admin'), getAllReviews);
router.put('/edit-review', editReview);
router.delete('/:id', deleteReview);
router.get('/:user/:service',  getReviews);


module.exports = router;