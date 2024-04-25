"use strict"
const { AUTH_CONSTANTS, USER_CONSTANTS, OTP_CONSTANTS, LOCATION_CONSTANTS } = require("../../config/constant");
const { User, validateUserSignup, validateUserLogin, validateUserEdit, validateUserSocialPost, validateChangePassword, validateForgotResetPasswordEmail, validateForgotResetPasswordToken, validateGetLocation, validateSubscription} = require("../models/user.js");
const { verifyAndDeleteToken, verifyToken } = require("../models/otp");
const { compareHash, generateHash } = require("../services/bcrypt.js");
const { generateToken } = require("../services/jwtToken.js");
const { authMiddleware } = require("../middleware/auth");
const multer = require("multer");
const axios = require('axios')
const storage = multer.memoryStorage();
const uploadDirect = multer({ storage: storage });
const { uploadFiles } = require("../services/awsService");
const _ = require("lodash");
const express = require("express");
const router = express.Router();


// signup
router.post("/create", async (req, res) => {
    const { error } = validateUserSignup(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let email;
    if (req.body.email) email = req.body.email.toLowerCase();

    let mobile;
    if (req.body.mobile) mobile = req.body.mobile;

    const existingUser = await User.findOne({ $or: [{ email: email }, { mobile: mobile }, { firebaseToken: req.body.firebaseToken }] });
    if (existingUser) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: USER_CONSTANTS.USER_ALREADY_EXISTS
    });

    const user = new User(_.pick(req.body, [
        "userType",
        "firstName",
        "lastName",
        "email",
        "countryCode",
        "mobile",
        "password",
        "confirmPassword",
        "referralCode",
        "firebaseToken",
        "termsAndConditions",
        "facebookId",
        "googleId"
    ]));

    user.email = email;
    user.mobile = mobile;
    user.status = "active";
    user.role = "user";
    user.password = generateHash(req.body.password);

    user.authToken = generateToken(user._id, user.email, user.role);

    // to unset device token of other user from same handset.
    if (req.body.firebaseToken) await User.updateMany({ firebaseToken: req.body.firebaseToken, email: { $ne: user.email } }, { $set: { firebaseToken: "" } });

    await user.save();
    user.userId = user._id;

    const response = _.pick(user, [
        "_id",
        "userId",
        "userType",
        "firstName",
        "lastName",
        "profilePic",
        "email",
        "countryCode",
        "mobile",
        "password",
        "referralCode",
        "companyName",
        "storeName",
        "aboutBusiness",
        "typeofProduct",
        "registrationNo",
        "exportLicenseNo",
        "uploadDocPic",
        "firebaseToken",
        "termsAndConditions",
        "facebookId",
        "googleId",
        "authToken",
        "authType",
        "role",
        "status",
        "updatedAt",
        "insertDate",
        "creationDate"
    ]);
    res.status(200).send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.USER_CREATED_SUCCESS,
        data: response

    });
});

// login
router.post("/login", async (req, res) => {
    const { error } = validateUserLogin(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let email;
    if (req.body.email) email = req.body.email.toLowerCase();

    let userType;
    if (req.body.userType) userType = req.body.userType;

    let user = await User.findOne({ email: email, userType: userType });
    if (!user) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: USER_CONSTANTS.NOT_FOUND
    });

    const validPassword = compareHash(req.body.password, user.password);
    if (!validPassword) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: AUTH_CONSTANTS.INVALID_PASSWORD,
    });
    const authToken = generateToken(user._id, user.email, user.role);
    user.authToken = authToken;
    await user.save();
    user.status = "active";

    let response = _.pick(user, [
        "_id",
        "userId",
        "userType",
        "firstName",
        "lastName",
        "profilePic",
        "email",
        "countryCode",
        "mobile",
        "password",
        "referralCode",
        "companyName",
        "storeName",
        "aboutBusiness",
        "typeofProduct",
        "registrationNo",
        "exportLicenseNo",
        "uploadDocPic",
        "firebaseToken",
        "termsAndConditions",
        "facebookId",
        "googleId",
        "authType",
        "role",
        "status",
        "updatedAt",
        "insertDate",
        "creationDate"
    ]);
    res.header("Authorization", authToken).send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.LOGIN_SUCCESS,
        data: response,
        authToken
    });
});

// view profile
router.get("/view/profile", authMiddleware(["user"]), async (req, res) => {
    let userId;
    if (req.jwtData.role === "user") userId = req.jwtData._id;

    let user = await User.findById(userId);
    if (!user) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: AUTH_CONSTANTS.INVALID_USER
    });

    user.userId = user._id;

    let response = _.pick(user, [
        "_id",
        "userId",
        "userType",
        "firstName",
        "lastName",
        "profilePic",
        "email",
        "countryCode",
        "mobile",
        "password",
        "referralCode",
        "companyName",
        "storeName",
        "aboutBusiness",
        "typeofProduct",
        "registrationNo",
        "exportLicenseNo",
        "uploadDocPic",
        "firebaseToken",
        "termsAndConditions",
        "facebookId",
        "googleId",
        "authType",
        "role",
        "status",
        "updatedAt",
        "insertDate",
        "creationDate"
    ]);
    return res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.VIEW_PROFILE_SUCCESS,
        data: response
    });
});

// edit profile
router.put("/edit/profile", authMiddleware(["user"]), (req, res, next) => {
    uploadDirect.fields([{ name: 'profilePic', maxCount: 1 }, { name: 'uploadDocPic', maxCount: 2 }])(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                if (err.field === 'profilePic') {
                    err.message = 'Maximum 1 image file is allowed for profile picture.';
                } else if (err.field === 'uploadDocPic') {
                    err.message = 'Maximum 2 image files are allowed for document upload.';
                }
                return res.status(400).send({
                    apiId: req.apiId,
                    statusCode: 400,
                    success: false,
                    message: err.message
                });
            }
        }
        next();
    });
}, async (req, res) => {

    try {
        // console.log('req.files:', req.files);
        // console.log('req.body:', req.body);

        const { error } = validateUserEdit(req.body);
        if (error) return res.status(400).send({
            apiId: req.apiId,
            statusCode: 400,
            success: false,
            message: error.details[0].message
        });

        let userId;
        if (req.jwtData.role === "user") userId = req.jwtData._id;
        let user = await User.findById(userId);
        if (!user) return res.status(400).send({
            apiId: req.apiId,
            statusCode: 400,
            success: false,
            message: AUTH_CONSTANTS.INVALID_USER
        });

        let profilePicUrl = [];
        if (req.files) {
            profilePicUrl = await uploadFiles(req.files, 'profilePic', 'images');
        }
        user.profilePic = profilePicUrl || user.profilePic;

        let uploadDocPicUrls = [];
        if (req.files) {
            uploadDocPicUrls = await uploadFiles(req.files, 'uploadDocPic', 'images');
        }
        user.uploadDocPic = uploadDocPicUrls || user.uploadDocPic;

        user.updatedAt = +new Date();
        user.firstName = req.body.firstName || user.firstName;
        user.lastName = req.body.lastName || user.lastName;
        user.companyName = req.body.companyName || user.companyName;
        user.storeName = req.body.storeName || user.storeName;
        user.aboutBusiness = req.body.aboutBusiness || user.aboutBusiness;
        user.typeofProduct = req.body.typeofProduct || user.typeofProduct;
        user.registrationNo = req.body.registrationNo || user.registrationNo;
        user.exportLicenseNo = req.body.exportLicenseNo || user.exportLicenseNo;
        user.firebaseToken = req.body.firebaseToken || user.firebaseToken;

        await user.save();
        user.userId = user._id;
        user.role = "user";

        let response = _.pick(user, [
            "_id",
            "userId",
            "userType",
            "firstName",
            "lastName",
            "profilePic",
            "email",
            "countryCode",
            "mobile",
            "referralCode",
            "companyName",
            "storeName",
            "aboutBusiness",
            "typeofProduct",
            "registrationNo",
            "uploadDocPic",
            "exportLicenseNo",
            "firebaseToken",
            "termsAndConditions",
            "facebookId",
            "googleId",
            "authType",
            "role",
            "status",
            "updatedAt",
            "insertDate",
            "creationDate"
        ]);
        res.status(200).send({
            apiId: req.apiId,
            statusCode: 200,
            success: true,
            message: USER_CONSTANTS.EDIT_PROFILE_SUCCESS,
            data: response
        });
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).send({
            apiId: req.apiId,
            statusCode: 500,
            success: false,
            message: 'Internal Server Error'
        });
    }
});

// forgot password
router.post("/forgot/password", async (req, res) => {
    const { error } = validateForgotResetPasswordEmail(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: USER_CONSTANTS.NO_USER_FOUND_EMAIL
    });

    // let isValid = await verifyAndDeleteToken(req.body.email, req.body.otpToken, "UFP");
    // if (!isValid) return res.status(400).send({
    //     apiId: req.apiId,
    //     statusCode: 400,
    //     success: false,
    //     message: OTP_CONSTANTS.INVALID_OTP
    // });

    var encryptPassword = generateHash(req.body.newPassword);
    user.password = encryptPassword;
    await user.save();
    res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.PASSWORD_RESET_SUCCESS
    });
});

router.post("/validate/forgot/password/token", async (req, res) => {
    const { error } = validateForgotResetPasswordToken(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: USER_CONSTANTS.NO_USER_FOUND_EMAIL
    });

    let isValid = await verifyAndDeleteToken(req.body.email, req.body.otpToken, "UFP");
    if (!isValid) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: OTP_CONSTANTS.INVALID_OTP
    });

    
    res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.VALID_TOKEN_SUCCESS
    });
});

router.post("/validate/location", async (req, res) => {
    const { error } = validateGetLocation(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let location = await axios.get(`http://api.geonames.org/countryCodeJSON?lat=${req.body.lat}&lng=${req.body.long}&username=${process.env.LOCATION_USER}`)

    // if (location?.data?.status) return res.status(400).send({
    //     apiId: req.apiId,
    //     statusCode: 400,
    //     success: false,
    //     message: location?.data?.status?.message
    // });

    if(location?.data?.countryCode !== "NG") return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: LOCATION_CONSTANTS.INVALID_LOCATION
    })

    res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        data: location?.data?.countryName,
        message: LOCATION_CONSTANTS.VALID_LOCATION,
    });
});

//change password
router.post("/change/password", authMiddleware(["user"]), async (req, res) => {
    const { error } = validateChangePassword(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let user = await User.findById(req.jwtData._id);
    if (!user) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: USER_CONSTANTS.NOT_FOUND
    });

    const validPassword = compareHash(req.body.oldPassword, user.password);
    if (!validPassword) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: USER_CONSTANTS.INVALID_OLD_PASSWORD
    });

    let encryptPassword = generateHash(req.body.newPassword);
    user.password = encryptPassword;

    await user.save();
    res.send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.PASSWORD_CHANGE_SUCCESS
    });
});

// logout
router.post("/logout", authMiddleware(["user"]), async (req, res) => {
    let userId;
    if (req.jwtData.role === "user") userId = req.jwtData._id;
    let user = await User.findById(userId);
    if (!user) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: AUTH_CONSTANTS.INVALID_USER
    });

    user.authToken = "";
    user.save();
    return res.status(200).send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.LOGOUT_SUCCESSFULLY
    });
});

router.post("/subscribe", async (req, res) => {
    const { error } = validateSubscription(req.body);
    if (error) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: error.details[0].message
    });

    let email;
    if (req.body.email) email = req.body.email.toLowerCase();


    let userExist = await User.findOne({ email: email });
    if (!userExist) return res.status(400).send({
        apiId: req.apiId,
        statusCode: 400,
        success: false,
        message: USER_CONSTANTS.NOT_FOUND
    });

    const user = new User(_.pick(req.body, [
        "email",
        "plan"
    ]));

    user.email = email;
    user.plan = mobile;
    user.status = "active";
    user.role = "user";
    user.password = generateHash(req.body.password);

    user.authToken = generateToken(user._id, user.email, user.role);

    // to unset device token of other user from same handset.
    if (req.body.firebaseToken) await User.updateMany({ firebaseToken: req.body.firebaseToken, email: { $ne: user.email } }, { $set: { firebaseToken: "" } });

    await user.save();
    user.userId = user._id;

    const response = _.pick(user, [
        "_id",
        "userId",
        "userType",
        "firstName",
        "lastName",
        "profilePic",
        "email",
        "countryCode",
        "mobile",
        "password",
        "referralCode",
        "companyName",
        "storeName",
        "aboutBusiness",
        "typeofProduct",
        "registrationNo",
        "exportLicenseNo",
        "uploadDocPic",
        "firebaseToken",
        "termsAndConditions",
        "facebookId",
        "googleId",
        "authToken",
        "authType",
        "role",
        "status",
        "updatedAt",
        "insertDate",
        "creationDate"
    ]);
    res.status(200).send({
        apiId: req.apiId,
        statusCode: 200,
        success: true,
        message: USER_CONSTANTS.USER_CREATED_SUCCESS,
        data: response

    });
});




module.exports = router;

