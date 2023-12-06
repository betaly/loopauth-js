import {reducer} from '../../reducer';
import {InitialAuthState} from '../../state';

describe('reducer', () => {
  it('should initialise when authenticated', async () => {
    const payload = {
      isAuthenticated: true,
      user: {id: 'abc', name: 'Bob'},
    };
    expect(reducer(InitialAuthState, {type: 'INITIALISED', ...payload})).toEqual({
      ...InitialAuthState,
      isLoading: false,
      ...payload,
    });
  });

  it('should initialise when not authenticated', async () => {
    const payload = {
      isAuthenticated: false,
    };
    expect(reducer(InitialAuthState, {type: 'INITIALISED', ...payload})).toEqual({
      ...InitialAuthState,
      isLoading: false,
      ...payload,
    });
  });

  it('should handle error state', async () => {
    const payload = {
      error: new Error('__test_error__'),
    };
    expect(reducer(InitialAuthState, {type: 'ERROR', ...payload})).toEqual({
      ...InitialAuthState,
      isLoading: false,
      ...payload,
    });
  });
});
