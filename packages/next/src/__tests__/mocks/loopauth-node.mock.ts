import type {NodeClient} from '@loopauth/node';

export const mockNodeClient: Partial<NodeClient> = {
  loginWithRedirect: jest.fn(),
  handleRedirectCallback: jest.fn(),
  getContext: jest.fn(async () => ({isAuthenticated: true})),
  logout: jest.fn(),
  isAuthenticated: jest.fn().mockReturnValue(true),
};
