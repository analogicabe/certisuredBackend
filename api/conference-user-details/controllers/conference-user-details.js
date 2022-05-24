"use strict";
const { parseMultipartData, sanitizeEntity } = require("strapi-utils");
const stripe = require("stripe")(process.env.STRIPE_KEY);

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  setUpStripe: async (ctx) => {
    const { total } = ctx.request.body;
    console.log(total);
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: "usd",
        description: "International Conference on Industry 4.0",
        payment_method_types: ["card"],
        shipping: {
          name: "International Conference",
          address: {
            line1: "510 Townsend St",
            postal_code: "98140",
            city: "San Francisco",
            state: "CA",
            country: "US",
          },
        },
      });
      return paymentIntent;
    } catch (err) {
      return { error: err.raw.message };
    }
  },

  //create
  async create(ctx) {
    const {
      payment_intent,
      name,
      email,
      phone,
      title_of_the_paper,
      name_of_the_authors,
    } = ctx.request.body;
    let paymentInfo;

    try {
      paymentInfo = await stripe.paymentIntents.retrieve(payment_intent.id);
      if (paymentInfo.status !== "succeeded") {
        throw { message: "You still have to pay" };
      } else {
        try {
          const emailTemplate = {
            subject: "Internation Conference on Industry 4.0",
            text: `Welcome to ICI4`,
            html: `<h2>Hello ${name},</h2>
                   <p>We acknowledge the receipt of your payment of 120 USD, to ICI4-2022, towards the processing fee for paper ${title_of_the_paper}.<p>
                   <p>An official digital receipt will be mailed to you shortly. Please feel free to connect with us for any further queries.</p>
                   <h6>Best regards,</h6>
                  <h6>Team ICI4 with <a href="https://certisured.com">certisured.com</a></h6>
                  `,
          };

          await strapi.plugins["email"].services.email.sendTemplatedEmail(
            {
              to: email,
              // from: is not specified, so it's the defaultFrom that will be used instead
            },
            emailTemplate
          );
        } catch (err) {
          console.log(err);
        }
      }
    } catch (err) {
      ctx.response.status = 402;
      return {
        error: err.message,
      };
    }

    const entry = {
      payment_intent: payment_intent.id,
      name,
      email,
      phone,
      title_of_the_paper,
      name_of_the_authors,
    };
    const entity = await strapi.services["conference-user-details"].create(
      entry
    );
    return sanitizeEntity(entity, {
      model: strapi.models["conference-user-details"],
    });
  },
};
