const response = require('../utils/response');

module.exports = (err, req, res, next) => {
    let error = Object.assign({}, err);
    
    console.log('💥💥', error);

    if(error.code === 'ERR_BAD_REQUEST'){
        error.message = error.response.data.message;
    }

    return response(res, error.status || 500, error.errorCode || 'e500', error.message || 'Something went wrong' )
}