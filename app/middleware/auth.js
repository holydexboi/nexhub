"use strict"
require('dotenv').config();
const mongoose = require("mongoose");
const { MIDDLEWARE_AUTH_CONSTANTS } = require("../../config/constant.js");
const { verifyToken } = require("../services/jwtToken");
const { SuperAdmin } = require("../models/superAdmin.js");
const { User } = require('../models/user.js');
// const { Parent } = require('../models/parent.js');

// authentication middleware
function authMiddleware(allowedRoleArray) {
    return async (req, res, next) => {
        if (!process.env.REQUIRED_IDENTITY_AUTH) return next();

        req.apiId = new mongoose.Types.ObjectId();
        req.startTimeMilli = Math.round(new Date());

        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).send({
                apiId: req.apiId,
                statusCode: 401,
                message: 'Failure',
                data: { message: MIDDLEWARE_AUTH_CONSTANTS.ACCESS_DENIED },
            });
        }
        const token = authHeader.split(' ')[1]; // Extract the token part

        try {
            const decoded = verifyToken(token);
            // console.log("verified token", decoded, token);

            req.jwtData = decoded;

            if (!allowedRoleArray.includes(decoded.role)) {
                return res.status(403).send({
                    apiId: req.apiId,
                    statusCode: 403,
                    message: 'Failure',
                    data: { message: MIDDLEWARE_AUTH_CONSTANTS.RESOURCE_FORBIDDEN },
                });
            }

            switch (decoded.role) {
                case 'superAdmin':
                    let superAdmin = await SuperAdmin.findOne({ _id: decoded._id });
                    if (!superAdmin || (superAdmin && superAdmin.authToken !== token))
                        return res.status(401).send({
                            apiId: req.apiId,
                            statusCode: 401,
                            message: 'Failure',
                            data: { message: MIDDLEWARE_AUTH_CONSTANTS.ACCESS_DENIED },
                        });
                    req.userData = superAdmin;
                    req.reqId = decoded._id;
                    break;

                case 'user':
                    const user = await User.findOne({ _id: decoded._id });
                    if (!user || (user && user.authToken !== token))
                        return res.status(401).send({
                            apiId: req.apiId,
                            statusCode: 401,
                            message: 'Failure',
                            data: { message: MIDDLEWARE_AUTH_CONSTANTS.ACCESS_DENIED },
                        });
                    req.userData = user;
                    req.reqId = decoded._id;
                    break;

                default:
                    return res.status(401).send({
                        apiId: req.apiId,
                        statusCode: 401,
                        message: 'Failure',
                        data: { message: MIDDLEWARE_AUTH_CONSTANTS.ACCESS_DENIED },
                    });
            }
            next();
        } catch (ex) {
            console.error(ex);
            res.status(401).send({
                apiId: req.apiId,
                statusCode: 401,
                message: 'Failure',
                data: { message: MIDDLEWARE_AUTH_CONSTANTS.INVALID_AUTH_TOKEN },
            });
        }
    };
}

module.exports = {
    authMiddleware
}