"use strict"
const bcrypt = require("bcrypt");

function generateHash(password) {
    const salts = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salts);
    if (!hashedPassword) {
        throw new Error('Error generating password hash');
    }
    return hashedPassword;
}

function compareHash(password, hash) {
    return bcrypt.compareSync(password, hash);
}

module.exports = {
    generateHash,
    compareHash
}