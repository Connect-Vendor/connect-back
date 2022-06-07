const express = require('express');
const xss = require('xss-clean');
const helmet = require('helmet');
const mongoSsanitize = require('express-mongo-sanitize');
const rateLimiter = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const ErrorHandler = require('./src/utils/Errorhandler');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const passport  = require('passport');
const ErrorController = require('./src/middleware/ErrorController');

//Passport init
require('./src/middleware/Oauth');

const UserRoute = require('./src/routes/UserRoute');
const AuthRoute= require('./src/routes/AuthRoutes');
const AdminRoute = require('./src/routes/AdminRouter');
const ServiceRoute = require('./src/routes/ServiceRouter');
const ReviewRoute = require('./src/routes/ReviewRoute');
const VendorRoute = require('./src/routes/VendorRouter');
const PaymentRoute = require('./src/routes/PaymentRouter');


const app = express();

/**
 * @desc Body parser 
 */
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended: true}));
app.use(cookieSession({
  maxAge: 24 * 60 * 60 * 10000,
  keys: [process.env.COOKIE_SESSION_KEY]
}));

//initialize passport
app.use(passport.initialize());
app.use(passport.session());

//Load static files
app.use('/public', express.static(__dirname + '/public'));

//SECURITY CHECKS

/**
 * @desc Rate limiter. allows only 200 request per hr from an IP 
 */
app.use('/api', rateLimiter({
  max: 200,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!'
}));

/**
 * @desc Helmet
 */
app.use(helmet());

/**
 * @desc Mongo sanitization against NOSQL query injection 
 */
app.use(mongoSsanitize())

/**
 * @desc Data Sanitization against XSS attacks
 */
app.use(xss());

/**
 * @desc Prevent Parameter polutioln
 */
// app.use(hpp({compression

//   whitelist: [
//     ''
//   ]
// }));

/**
 * @desc Compresses response data 
 */
app.use(compression());


//Dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Base route Routes
app.use('/api/v1/auth', AuthRoute)
app.use('/api/v1/users', UserRoute);
app.use('/api/v1/admin', AdminRoute);
app.use('/api/v1/review', ReviewRoute);
app.use('/api/v1/service', ServiceRoute);
app.use('/api/v1/vendor', VendorRoute);
app.use('/api/v1/payment', PaymentRoute);
app.get('/favicon.ico', (req, res) => res.status(204));
app.use('/', (req, res) => res.status(200).json({code: 's200', message: 'Welcome to Vendconn', status: true}))
// app.use('/api/v1/')


app.use('*', (req, res, next) => {
  next(new ErrorHandler(`Can't resolve ${req.originalUrl}`, false, 'e500'))
});

//Global Error handler
app.use(ErrorController);

module.exports = app;
