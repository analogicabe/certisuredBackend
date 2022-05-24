"use strict";
const { parseMultipartData, sanitizeEntity } = require("strapi-utils");
const stripe = require("stripe")(process.env.STRIPE_KEY);
const Razorpay = require("razorpay");
const crypto = require("crypto");
const insta = require("instamojo-nodejs");

module.exports = {
  /**
   * Retrieve records.
   *
   * @return {Array}
   */

  async find(ctx) {
    const { user } = ctx.state;
    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.order.search({
        ...ctx.query,
        user: user.id,
      });
    } else {
      entities = await strapi.services.order.find({
        ...ctx.query,
        user: user.id,
      });
    }

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.order })
    );
  },
  async findOne(ctx) {
    const { id } = ctx.params;
    const { user } = ctx.state;

    const entity = await strapi.services.order.findOne({ id, user: user.id });
    return sanitizeEntity(entity, { model: strapi.models.order });
  },

  //Start of setUpStripe

  setUpStripe: async (ctx) => {
    let total;
    let validateCart = [];
    let recieptCart = [];

    const { cart } = ctx.request.body;
    await Promise.all(
      cart.map(async (course) => {
        const validateProduct = await strapi.services.course.findOne({
          id: course.course,
        });
        if (validateProduct) {
          validateProduct.qty = course.qty;
          validateProduct.price = course.price;
          validateCart.push(validateProduct);

          recieptCart.push({
            id: course.course,
            qty: course.qty,
          });
        }

        return validateProduct;
      })
    );
    total = strapi.config.functions.cart.cartSubTotal(validateCart);
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: total,
        currency: "inr",
        metadata: { cart: JSON.stringify(recieptCart) },
      });
      return paymentIntent;
    } catch (err) {
      return { error: err.raw.message };
    }
  },

  //end of setUpStripe
  //razorpay
  setUpRazorpay: async (ctx) => {
    let total;
    let validateCart = [];
    let recieptCart = [];

    const { cart } = ctx.request.body;
    const { user } = ctx.state;
    await Promise.all(
      cart.map(async (course) => {
        const validateProduct = await strapi.services.course.findOne({
          id: course.course,
        });
        if (validateProduct) {
          validateProduct.qty = course.qty;
          validateProduct.price = course.price;
          validateCart.push(validateProduct);

          recieptCart.push({
            id: course.course,
            qty: course.qty,
          });
        }

        return validateProduct;
      })
    );
    total = strapi.config.functions.cart.cartSubTotal(validateCart);

    try {
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY,
        key_secret: process.env.RAZORPAY_SECRET,
      });
      const options = {
        amount: total, // amount in smallest currency unit
        currency: "INR",
        receipt: `reciept_${user.id}`,
      };
      const order = await instance.orders.create(options);

      if (!order) {
        throw { message: "some error occured" };
      }

      return order;
    } catch (err) {
      console.log(err);
    }
  },

  //end of razorpay

  //instamojo
  setUpInstamojo: async (ctx) => {
    const {
      purpose,
      amount,
      buyer_name,
      redirect_url,
      email,
      phone,
      send_email,
      webhook,
      send_sms,
    } = ctx.request.body;
    insta.setKeys(
      "test_63fdad75600d646cd06850dce18",
      "test_89505e2230f832f16402c84e5f4"
    );

    const instance = new insta.PaymentData();
    insta.isSandboxMode(true);

    instance.purpose = purpose;
    instance.amount = amount;
    instance.buyer_name = buyer_name;
    instance.redirect_url = redirect_url;
    instance.email = email;
    instance.phone = phone;
    instance.send_email = send_email;
    instance.webhook = webhook;
    instance.send_sms = send_sms;
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
  // webhook instamojo
  instamojoWebhook: async (ctx) => {
    console.log(ctx.request.body);
  },

  //end of webhook
  //success
  async create1(ctx) {
    const {
      orderCreationId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
      cart,
      total,
    } = ctx.request.body;

    const { user } = ctx.state;
    const shasum = crypto.createHmac("sha256", "sIeK6fkVHQs0xMJw1J7ozMds");
    shasum.update(`${orderCreationId}|${razorpayPaymentId}`);

    const digest = shasum.digest("hex");

    if (digest !== razorpaySignature) {
      return { msg: "Transaction not legit!" };
    }
    let courses = [];

    await Promise.all(
      cart.map(async (c) => {
        const foundCourse = await strapi.services.course.findOne({
          id: c.course,
        });

        if (foundCourse) {
          courses.push(foundCourse);
        }
        return foundCourse;
      })
    );

    const entry = {
      courses,
      user: user,
      status: "paid",
      total: total,
      checkout_session: razorpayOrderId,
      shipping_name: user.username,
    };
    const entity = await strapi.services.order.create(entry);
    return sanitizeEntity(entity, { model: strapi.models.order });
  },

  //successs
  async create(ctx) {
    const {
      paymentIntent,
      shipping_name,
      shipping_email,
      shipping_phone,
      cart,
      total,
    } = ctx.request.body;
    const { user } = ctx.state;

    let paymentInfo;

    try {
      paymentInfo = await stripe.paymentIntents.retrieve(paymentIntent.id);
      if (paymentInfo.status !== "succeeded") {
        throw { message: "You still have to pay" };
      }
    } catch (err) {
      ctx.response.status = 402;
      return {
        error: err.message,
      };
    }

    const alreadyExistingOrder = await strapi.services.order.find({
      paymentIntent_id: paymentIntent.id,
    });

    if (alreadyExistingOrder && alreadyExistingOrder.length > 0) {
      ctx.response.status = 402;
      return {
        error: "This payment intent was already used",
      };
    }

    let courses = [];

    await Promise.all(
      cart.map(async (c) => {
        const foundCourse = await strapi.services.course.findOne({
          id: c.course,
        });

        if (foundCourse) {
          courses.push(foundCourse);
        }
        return foundCourse;
      })
    );

    // if (paymentInfo.amount !== total) {
    //   ctx.response.status = 402;
    //   return {
    //     error:
    //       "The total to be paid is different from the total from the Payment Intent",
    //   };
    // }
    const entry = {
      paymentIntent_id: paymentIntent.id,
      shipping_name,
      shipping_email,
      shipping_phone,
      courses,
      user: user,
      status: "paid",
      total: total,
    };
    const entity = await strapi.services.order.create(entry);
    return sanitizeEntity(entity, { model: strapi.models.order });
  },
};
