import {CodeExchangeEndpointOptions, RefreshTokenEndpointOptions} from './types';

export function isCodeExchangeEndpointOptions(options: any): options is CodeExchangeEndpointOptions {
  return options?.code;
}

export function isRefreshTokenEndpointOptions(options: any): options is RefreshTokenEndpointOptions {
  return options?.refreshToken && !options?.tenantId;
}

export function isSwitchTokenEndpointOptions(options: any): options is RefreshTokenEndpointOptions {
  return options?.refreshToken && options?.tenantId;
}
