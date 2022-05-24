module.exports = ({ env }) => ({
  defaultConnection: 'default',
  connections: {
    default: {
      connector: 'mongoose',
      settings: {
        host: 'strapi-atlas.aoijc.mongodb.net',
        srv: true,
        port: 27017,
        database: 'strapi-atlas',
        username: 'certisured',
        password: 'certisuredmongo2022',
      },
      options: {
        authenticationDatabase:  null,
        ssl: true,
      },
    },
  },
});
