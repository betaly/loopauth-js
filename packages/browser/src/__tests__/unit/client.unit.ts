import {WebAuthClient} from '../../client';

describe('AuthClient', function () {
  it('should construct', function () {
    const client = new WebAuthClient({
      domain: 'test.dev',
      authProvider: 'autha',
      clientId: 'test_client_id',
    });
    expect(client).toBeDefined();
  });
});
