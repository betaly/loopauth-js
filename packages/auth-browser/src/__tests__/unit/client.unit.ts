import {AuthClient} from '../../client';

describe('AuthClient', function () {
  it('should construct', function () {
    const client = new AuthClient({
      domain: 'test.dev',
      clientId: 'test_client_id',
      loginPath: '/login',
    });
    expect(client).toBeDefined();
  });
});
