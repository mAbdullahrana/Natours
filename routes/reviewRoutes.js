const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reviewController.getAllReviews)
  .get(authController.protect, reviewController.getReview)
  .post(
    authController.protect,
    reviewController.setTourAndReviewsIds,
    reviewController.createReview
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(authController.protect, reviewController.deleteReview);

module.exports = router;
