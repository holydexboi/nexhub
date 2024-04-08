module.exports = function (err, req, res, next) {
    // logger.error(err.message, err);
    console.log(err);

    // error
    // warn
    // info
    // verbose
    // debug
    // silly
    res.errorMessage = err.message
    res.status(500).send({ apiId: req.apiId, statusCode: 500, message: "Failure", data: { message: "Something failed. Please try again after 5 minutes" } });
};