"use strict";
const { parseMultipartData, sanitizeEntity } = require("strapi-utils");

const insta = require("instamojo-nodejs");

module.exports = {
  setUpInstamojo: async (ctx) => {
    const { purpose, amount, buyer_name, redirect_url, email, phone, webhook } =
      ctx.request.body;
    insta.setKeys(
      process.env.INSTAMOJO_API_KEY,
      process.env.INSTAMOJO_AUTH_KEY
    );

    const instance = new insta.PaymentData();

    instance.purpose = purpose;
    instance.amount = amount;
    instance.buyer_name = buyer_name;
    instance.redirect_url = redirect_url;
    instance.email = email;
    instance.phone = phone;
    instance.send_email = false;
    instance.webhook = webhook;
    instance.send_sms = false;
    instance.allow_repeated_payments = false;

    const res = new Promise((resolve, reject) => {
      insta.createPayment(instance, (error, response) => {
        resolve(response);
      });
    });

    return res
      .then((response) => {
        return response;
      })
      .catch((err) => console.log(err));
  },
  //end of instamojo

};
