import {GenericError, TimeoutError} from '@loopauth/client';

/**
 * Error thrown when the login popup times out (if the user does not complete auth)
 */
export class PopupTimeoutError extends TimeoutError {
  constructor(public popup: Window) {
    super();
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, PopupTimeoutError.prototype);
  }
}

export class PopupCancelledError extends GenericError {
  constructor(public popup: Window) {
    super('cancelled', 'Popup closed');
    //https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    Object.setPrototypeOf(this, PopupCancelledError.prototype);
  }
}
