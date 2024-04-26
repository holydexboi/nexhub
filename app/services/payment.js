'use strict';

const customer = require('paystack-api/resources/customer');

require('dotenv').config();
var paystack = require("paystack-api")(process.env.PAYSTACK_KEY);

async function pay( email, amount, currency, plan){

    await paystack.transaction
      .initialize({
        email: email,
        amount: amount,
        currency: currency,
        plan: plan,


      })
      .then(function(error, body) {
        console.log(error);
        console.log(body);
      });
}

module.exports = {
    pay
  }