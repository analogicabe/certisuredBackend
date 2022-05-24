"use strict";

module.exports = {
  settings: {
    cors: {
      origin: ["*"],

      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
      headers: ["*"],
    },
  },
};
