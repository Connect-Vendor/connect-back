module.exports = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
        console.log('ERROR',error);
       return next(error);
    });
}

