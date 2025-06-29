const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
}
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if the email and password provided
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // If user exists

  const user = await User.findOne({ email }).select('+password');

  // Check if user exists and password is correct
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // if there is no token

  if (!token) {
    return next(
      new AppError('You are not logged in please log in to get access', 401)
    );
  }

  // decode the token
  const decoded = await jwt.verify(token, process.env.JWT_SECRET);

  // check if the user exist
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );
  }

  // If the password is changed after the token date

  if (!(await User.changedPasswordAfter(decoded.iat))) {
    next(
      new AppError('User recently changed password! Please log in again', 401)
    );
  }

  // Grant Access to protected route
  next();
});
