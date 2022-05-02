const response = require('../utils/response');

module.exports = (err, req, res, next) => {
    let error = Object.assign({}, err);
    
    console.log('💥💥', error);

    return response(res, error.status || 500, error.errorCode || 'e500', error.message || 'Something went wrong' )
}