module.exports = ({ env }) => ({
  // ...
  email: {
    provider: "nodemailer",
    providerOptions: {
      host: "smtp-relay.sendinblue.com",
      port: "587",
      auth: {
        user: "analogica@analogica.in",
        pass: "a0Rqd4YOWJLKcX1D",
      },
    },
    settings: {
      defaultFrom: "users@certisured.com",
      defaultReplyTo: "users@certisured.com",
    },
  },
  // ...
})