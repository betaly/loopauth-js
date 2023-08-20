import * as dotenv from 'dotenv';
import * as dotenvExt from 'dotenv-extended';
import {ApplicationConfig, AuthExampleApplication} from '@loopx/auth-example';
import logServerUrls from 'log-server-urls';
import {AuthApiApplication} from './application';

dotenv.config();
if (process.env.NODE_ENV !== 'test') {
  dotenvExt.load({
    schema: '.env.schema',
    errorOnMissing: true,
    includeProcessEnv: true,
  });
} else {
  dotenvExt.load({
    schema: '.env.schema',
    errorOnMissing: false,
    includeProcessEnv: true,
  });
}

export async function main(options: ApplicationConfig = {}): Promise<AuthExampleApplication> {
  const app = new AuthApiApplication(options);
  await app.boot();
  await app.start();

  logServerUrls(options.rest.port, options.rest.host);

  return app;
}

if (require.main === module) {
  const PORT = +(process.env.PORT ?? 5001);
  // Run the application
  const config = {
    rest: {
      port: PORT,
      host: process.env.HOST,
      // The `gracePeriodForClose` provides a graceful close for http/https
      // servers with keep-alive clients. The default value is `Infinity`
      // (don't force-close). If you want to immediately destroy all sockets
      // upon stop, set its value to `0`.
      // See https://www.npmjs.com/package/stoppable
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        // useful when used with OpenAPI-to-GraphQL to locate your application
        setServersFromRequest: true,
      },
    },
    auth: {
      autha: {
        endpoint: process.env.AUTHA_ENDPOINT,
        clientID: process.env.AUTHA_CLIENT_ID,
        // clientSecret: process.env.AUTHA_CLIENT_SECRET,
        redirectUri: `http://localhost:${PORT}/auth/autha-redirect`,
        postLogoutRedirectUri: `http://localhost:${PORT}/logout/redirect`,
      },
    },
  };
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
