const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,difficulty,summary';
  next();
};

exports.getAllTours = async (req, res) => {
  try {
    const features = new ApiFeatures(Tour.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const tours = await features.query;

    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        tours
      }
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err.message
    });
  }
};

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  if (!tour) {
    return next(new AppError(`No tour found with ID ${req.params.id}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.createTour = catchAsync(async (req, res) => {
  const tour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!tour) {
    return next(new AppError(`No tour found with ID ${req.params.id}`, 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour
    }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  if (!tour) {
    return next(new AppError(`No tour found with ID ${req.params.id}`, 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' }
      }
    }
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // e.g., 2021

  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
    // Convert the string to a Date:
    {
      $addFields: {
        startDateObj: { $toDate: '$startDates' }
        // If your strings aren’t ISO, use:
        // startDateObj: { $dateFromString: { dateString: '$startDates', /* optionally format */ } }
      }
    },
    {
      $match: {
        startDateObj: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDateObj' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    { $addFields: { month: '$_id' } },
    { $project: { _id: 0 } },
    { $sort: { numTourStarts: -1 } },
    { $limit: 12 }
  ]);

  res.status(200).json({
    status: 'success',
    data: { plan }
  });
});
