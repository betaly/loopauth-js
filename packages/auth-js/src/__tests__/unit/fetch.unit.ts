import {MfaRequiredError, MissingRefreshTokenError} from '../../errors';
import {fetchJson, switchFetch} from '../../fetch';

const mockUnfetch = <jest.Mock>fetch;

describe('switchFetch', () => {
  it('clears timeout when successful', async () => {
    mockUnfetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(),
      }),
    );
    jest.spyOn(window, 'clearTimeout');
    await switchFetch('https://test.com/', {});
    expect(clearTimeout).toBeCalledTimes(1);
  });
});

describe('getJson', () => {
  it('throws MfaRequiredError when mfa_required is returned', async () => {
    mockUnfetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({error: 'mfa_required'}),
      }),
    );

    await expect(fetchJson('https://test.com/', {})).rejects.toBeInstanceOf(MfaRequiredError);
  });

  it('reads the mfa_token when mfa_required is returned', async () => {
    mockUnfetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({error: 'mfa_required', mfa_token: '1234'}),
      }),
    );

    await expect(fetchJson('https://test.com/', {})).rejects.toHaveProperty('mfa_token', '1234');
  });

  it('throws MissingRefreshTokenError when missing_refresh_token is returned', async () => {
    mockUnfetch.mockImplementation(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({error: 'missing_refresh_token'}),
      }),
    );

    await expect(fetchJson('https://test.com/', {})).rejects.toBeInstanceOf(MissingRefreshTokenError);
  });
});
