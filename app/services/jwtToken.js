"use strict"
require('dotenv').config();
const jwt = require('jsonwebtoken')

const jwtSecretKey = process.env.JWT_SECRET_KEY;
// console.log(`JWT_SECRET_KEY: ${jwtSecretKey}`);


function generateToken(_id, email, role) {
    return jwt.sign({ _id: _id, email: email, role: role }, jwtSecretKey, { expiresIn: '2d' });
}

const verifyToken = (token) => {
    return jwt.verify(token, jwtSecretKey);
}

function generateAuthToken(auth){
    return jwt.sign({...auth}, jwtSecretKey)
}

module.exports = {
    generateToken,
    verifyToken,
    generateAuthToken
}