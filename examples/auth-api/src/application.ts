import {ApplicationConfig, AuthExampleApplication} from '@loopx/auth-example';
import {ILogger, LOGGER} from '@loopx/core';
import Sessions, {type SessionOptions} from 'client-sessions';
import {ExpressMiddlewareFactory} from '@loopback/express';
import {RestTags} from '@loopback/rest';

export class AuthApiApplication extends AuthExampleApplication {
  constructor(config?: ApplicationConfig) {
    super(config);

    const logger = this.getSync<ILogger>(LOGGER.LOGGER_INJECT);
    // autha configuration
    logger.info('adding session middleware');
    this.expressMiddleware(
      Sessions as ExpressMiddlewareFactory<SessionOptions>,
      {
        cookieName: 'session',
        secret: 'secret',
        duration: 1800 * 1000,
        activeDuration: 300 * 1000,
      },
      {
        chain: RestTags.ACTION_MIDDLEWARE_CHAIN,
      },
    );
  }
}
