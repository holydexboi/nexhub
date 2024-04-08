"use strict"
const { SuperAdmin } = require("../models/superAdmin");
const { generateHash } = require("../services/bcrypt");


// function to set required db enteries for project initial state 
module.exports = async function () {
    try {
        // check if admin already exists or not
        let query = {}
        let superAdmin = await SuperAdmin.findOne(query);
        if (!superAdmin) {
            let defaultPassword = '12345678';
            let password = generateHash(defaultPassword);
            let newSuperAdmin = {
                fullName: "Super Admin",
                address: "",
                email: "superadmin@nexhub.com",
                password: password,
                superAdmin: true,
                createdAt: +new Date()
            }
            await SuperAdmin.create(newSuperAdmin);
        }
    }
    catch (err) {
        throw err;
    }
}
