import {ClientType} from '@bleco/authentication';
import {inject, LifeCycleObserver, lifeCycleObserver, service} from '@loopback/core';
import {ILogger, LOGGER} from '@loopx/core';
import {AuthClientService} from '@loopx/user-core';

@lifeCycleObserver('auth-api-seeder')
export class AuthApiSeeder implements LifeCycleObserver {
  logger: ILogger;
  constructor(
    @inject(LOGGER.LOGGER_INJECT)
    logger: ILogger,
    @service(AuthClientService)
    private readonly authClientService: AuthClientService,
  ) {
    this.logger = logger.extend('auth-api-seeder');
  }

  async start() {
    if (process.env.SEED_DATA) {
      await this.seed();
    }
  }

  async stop() {
    // Nothing to do
  }

  async seed() {
    this.logger.info('Seeding data');
    // seed auth client
    const authClient = await this.authClientService.create({
      name: 'Next',
      description: 'Next App client',
      clientId: 'next',
      clientSecret: 'next',
      clientType: ClientType.public,
      redirectUrl: 'http://localhost:3000/api/auth/sign-in-callback',
      postLogoutRedirectUris: ['http://localhost:3000'],
    });
    this.logger.debug(authClient, 'Auth client created');
  }
}
