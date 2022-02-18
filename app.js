const express = require('express');
const morgan = require('morgan');
const userRouter = require('./routes/UserRoute');

const app = express();

//Body parser
app.use(express.json());

//Dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//User Main Route
app.use('/api/v1/users/', userRouter);

module.exports = app;
