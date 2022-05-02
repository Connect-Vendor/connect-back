module.exports = (res, status, code, message, data = null) => {
   return res.status(status).json({
        code,
        message,
        data
    });
}