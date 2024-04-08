"use strict"
const mongoose = require("mongoose");
const { ApiLog } = require("../models/apiLog");


module.exports = function (req, res, next) {
    console.log({
        host: req.headers["host"],
        contentType: req.headers["content-type"],
        Authorization: req.headers["Authorization"],
        method: req.method,
        url: req.url,
        body: req.body,
    });

    const cleanup = () => {
        res.removeListener("finish", loggerFunction);
        res.removeListener("close", loggerFunction);
        res.removeListener("error", loggerFunction);
    };
    const loggerFunction = async () => {
        cleanup();
        // console.log("Before logging: ", res.req.apiId);
        try {
            if (res.req.apiId) {
                let endTimeMilli = new Date();
                let responseTimeMilli = endTimeMilli - req.startTimeMilli;
                let tPath = "";
                if (req.route) {
                    tPath = req.route.path;
                }
                await logApis(req.apiId, req.method, req.reqUserId, req.reqLabId, req.originalUrl, req.baseUrl + tPath, req.baseUrl, req.query, req.params, req.body, req.startTimeMilli, endTimeMilli, responseTimeMilli, res.statusCode, res.errorMessage);
            }
        } catch (Ex) {
            console.log("Exception in logging: ", Ex);
        }
    };
    res.on("finish", loggerFunction); // successful pipeline (regardless of its response)
    res.on("close", loggerFunction); // aborted pipeline
    res.on("error", loggerFunction); // pipeline internal error
    req.apiId = new mongoose.Types.ObjectId();
    req.startTimeMilli = Math.round(new Date());
    next();
};

async function logApis(apiId, method, userId, labId, completeUrl, url, baseUrl, query, params, body, startTimeMilli, endTimeMilli, responseTimeMilli, statusCode, errorMessage) {
    let apiLog = new ApiLog({
        apiId,
        method,
        userId,
        labId,
        completeUrl,
        url,
        baseUrl,
        query,
        params,
        body,
        startTimeMilli,
        endTimeMilli,
        responseTimeMilli,
        statusCode,
        errorMessage,
    });
    await apiLog.save();
}
