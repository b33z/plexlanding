export const development = {
  secureApi: false,

  database: {
    username: 'admin',
    password: null,
    filename: 'database_dev.db',
    force: process.env.FORCE_CREATE || false
  },

  log: {
    filename: 'server_dev.log',
    level: 'DEBUG'
  }
};

export const production = {
  secureApi: true,

  defaultUser: {
    username: 'Administrator',
    password: '$PlexLanding$'
  },

  database: {
    username: 'admin',
    password: null
  },

  log: {
    level: 'INFO',
    short: true
  }
};

export default { development, production };
