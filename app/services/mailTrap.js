'use strict';
require('dotenv').config();
const { MailtrapClient} = require("mailtrap");

const TOKEN = process.env.MAIL_TRAP_PASS

const client  = new MailtrapClient({endpoint:'https://send.api.mailtrap.io/', token: TOKEN})

const sender = {name: "NexHub", email: "mailtrap@nigerianexportershub.com"}

// async..await is not allowed in global scope, must use a wrapper
async function main(receiver, subject, message) {
  // send mail with defined transport object
  try{

    client.send({
      from: sender,
      to: receiver,
      subject: subject,
      text: message
    })
  }catch(err){
    console.log(err)
    return { error: err, statusCode: 400 };
  }

}

module.exports = {
  main
}

//main().catch(console.error);