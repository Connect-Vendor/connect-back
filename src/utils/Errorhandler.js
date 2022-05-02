class ErrorHandler extends Error {
    constructor(message, status, errorCode){
        super();
        this.errorCode = errorCode
        this.status = status;
        this.message  = message;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ErrorHandler;