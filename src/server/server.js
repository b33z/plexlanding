import { join } from 'path';
import http from 'http';

import hat from 'hat';
import Express from 'express';
import PrettyError from 'pretty-error';
import favicon from 'serve-favicon';
import compression from 'compression';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
import errorHandler from 'errorhandler';
import helmet from 'helmet';

import configuration from './config';
import logger from './logger';
import database from './database';
import sockets from './sockets';
import routes from './routes';

const pretty = new PrettyError();
const app = new Express();
const server = new http.Server(app);

export async function start(config) {
  if (!config) {
    throw new Error('No config was passed to server');
  }

  const log = logger.create('Server');

  // If the secrets session hasn't been initialized, do so
  if (config.secrets.session === 'REPLACE') {
    log.info('Randomly generating new session secret');
    const session = { session: hat() };
    config.secrets.session = session.session;
    new configuration.User().update({ secrets: session });
  }

  // Set up the server
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());
  app.use(helmet());
  app.use(Express.static(config.paths.root));
  app.use(favicon(join(config.paths.root, 'favicon.ico')));

  // Setup middleware
  if (config.env === 'production') {
    app.use(morgan('short', {
      skip: (req, res) => res.statusCode < 400
    }));
  } else {
    app.use(morgan('dev'));
    app.use(errorHandler());
  }

  // Register all server components
  log.info('Initializing server components').debug('Using config', config);
  await database.init(config);
  routes.register(app, config);
  sockets.register(server);

  server.listen(config.port, (err) => {
    if (err) {
      log.error(`Error listening on port :${config.port}`);
      throw err;
    } else {
      log.info(`✅ OK ${config.title} is running on http://localhost:${config.port}.`);
      return Promise.resolve();
    }
  });
}

export default { start };
