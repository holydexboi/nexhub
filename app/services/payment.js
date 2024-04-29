'use strict';

const customer = require('paystack-api/resources/customer');

require('dotenv').config();
var paystack = require("paystack-api")(process.env.PAYSTACK_KEY);

async function pay( email, amount, currency, plan){

   const response =  await paystack.transaction
      .initialize({
        email: email,
        amount: amount,
        currency: currency,
        plan: plan,


      })
      .then(function(error, body) {
        return error;
        //console.log(body);
      });

    return response
}

async function verify( reference ){

  const response =  await paystack.transaction
     .verify({
      reference: reference


     })
     .then(function(error, body) {
       return error;
       //console.log(body);
     });

   return response
} 

module.exports = {
    pay,
    verify
  }