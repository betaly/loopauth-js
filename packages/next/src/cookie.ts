import {RequestCookies, ResponseCookies} from '@edge-runtime/cookies';
import type {CookieSerializeOptions} from 'cookie';
import {ServerResponse} from 'http';
import type {NextApiRequestCookies} from 'next/dist/server/api-utils';

import {logger as defaultLogger, LoggerInstance} from './logger';

const ALLOWED_COOKIE_SIZE = 4096;
// Based on commented out section above
const ESTIMATED_EMPTY_COOKIE_SIZE = 160;
const CHUNK_SIZE = ALLOWED_COOKIE_SIZE - ESTIMATED_EMPTY_COOKIE_SIZE;

export interface CookieOption {
  name: string;
  options: CookieSerializeOptions;
}

export interface Cookie extends CookieOption {
  value: string;
}

type Chunks = Record<string, string>;

export interface ChunkOptions extends Partial<Cookie['options']> {
  chunkSize?: number;
}

export class SessionStore {
  #name: string;
  #chunks: Chunks = {};
  #options: CookieSerializeOptions;
  #logger: LoggerInstance | Console;

  constructor(
    name: string,
    cookies: Partial<Record<string, string>> | RequestCookies = {},
    option: CookieSerializeOptions = {},
    logger: LoggerInstance | Console = defaultLogger,
  ) {
    this.#name = name;
    this.#logger = logger;
    this.#options = option;
    if (!cookies) return;

    let items = cookies;
    if (cookies instanceof RequestCookies) {
      items = [...cookies].reduce(
        (acc, [key, cookie]) => {
          acc[key] = cookie.value;
          return acc;
        },
        {} as Record<string, string>,
      );
    }

    for (const [cookieName, cookieValue] of Object.entries(items)) {
      if (!cookieName.startsWith(this.#name) || !cookieValue) continue;
      this.#chunks[cookieName] = cookieValue;
    }
  }

  /**
   * The JWT Session or database Session ID
   * constructed from the cookie chunks.
   */
  get value() {
    // Sort the chunks by their keys before joining
    const sortedKeys = Object.keys(this.#chunks).sort((a, b) => {
      const aSuffix = parseInt(a.split('.').pop() || '0');
      const bSuffix = parseInt(b.split('.').pop() || '0');

      return aSuffix - bSuffix;
    });

    // Use the sorted keys to join the chunks in the correct order
    return sortedKeys.map(key => this.#chunks[key]).join('');
  }

  /**
   * Given a cookie value, return new cookies, chunked, to fit the allowed cookie size.
   * If the cookie has changed from chunked to unchunked or vice versa,
   * it deletes the old cookies as well.
   */
  chunk(value: string, {chunkSize, ...options}: ChunkOptions): Cookie[] {
    // Assume all cookies should be cleaned by default
    const cookies: Record<string, Cookie> = this.#clean();

    // Calculate new chunks
    const chunked = this.#chunk(
      {
        name: this.#name,
        value,
        options: {...this.#options, ...options},
      },
      chunkSize,
    );

    // Update stored chunks / cookies
    for (const chunk of chunked) {
      cookies[chunk.name] = chunk;
    }

    return Object.values(cookies);
  }

  /** Returns a list of cookies that should be cleaned. */
  clean(): Cookie[] {
    return Object.values(this.#clean());
  }

  /** Given a cookie, return a list of cookies, chunked to fit the allowed cookie size. */
  #chunk(cookie: Cookie, chunkSize = CHUNK_SIZE): Cookie[] {
    chunkSize = chunkSize || CHUNK_SIZE;
    const chunkCount = Math.ceil(cookie.value.length / chunkSize);

    if (chunkCount === 1) {
      this.#chunks[cookie.name] = cookie.value;
      return [cookie];
    }

    const cookies: Cookie[] = [];
    for (let i = 0; i < chunkCount; i++) {
      const name = `${cookie.name}.${i}`;
      const value = cookie.value.substring(i * chunkSize, (i + 1) * chunkSize);
      cookies.push({...cookie, name, value});
      this.#chunks[name] = value;
    }

    this.#logger.debug('CHUNKING_SESSION_COOKIE', {
      message: `Session cookie exceeds allowed ${ALLOWED_COOKIE_SIZE} bytes.`,
      emptyCookieSize: ESTIMATED_EMPTY_COOKIE_SIZE,
      valueSize: cookie.value.length,
      chunks: cookies.map(c => c.value.length + ESTIMATED_EMPTY_COOKIE_SIZE),
    });

    return cookies;
  }

  /** Returns cleaned cookie chunks. */
  #clean(): Record<string, Cookie> {
    const cleanedChunks: Record<string, Cookie> = {};
    for (const name in this.#chunks) {
      delete this.#chunks?.[name];
      cleanedChunks[name] = {
        name,
        value: '',
        options: {...this.#options, maxAge: 0},
      };
    }
    return cleanedChunks;
  }
}

function filterCookieNames(cookies: RequestCookies | NextApiRequestCookies, namePrefix: string) {
  const names = cookies instanceof RequestCookies ? [...cookies].map(([key]) => key) : Object.keys(cookies);
  return names.filter(name => name.startsWith(namePrefix));
}

export function chunkCookieToResponseCookies(
  namePrefix: string,
  longValue: string,
  cookieOptions: ChunkOptions,
  responseCookies: ResponseCookies,
  requestCookies: RequestCookies,
) {
  const cookies = new SessionStore(namePrefix, {}, cookieOptions).chunk(longValue, cookieOptions);
  for (const {name, value, options} of cookies) {
    responseCookies.set(name, value, options);
  }
  const names = cookies.map(({name}) => name);
  const oldNames = filterCookieNames(requestCookies, namePrefix);
  const namesToDelete = oldNames.filter(name => !names.includes(name));
  namesToDelete.forEach(name => responseCookies.delete(name));
}

export function chunkCookieToServerResponse(
  namePrefix: string,
  longValue: string,
  cookieOptions: ChunkOptions,
  serverResponse: ServerResponse,
  requestCookies: NextApiRequestCookies,
) {
  const cookies = new SessionStore(namePrefix, {}, cookieOptions).chunk(longValue, cookieOptions);
  for (const {name, value, options} of cookies) {
    const cookieString = `${name}=${value}; Max-Age=${options.maxAge}; Path=${options.path}; HttpOnly; SameSite=${options.sameSite}`;
    serverResponse.setHeader('Set-Cookie', cookieString);
  }
  const names = cookies.map(({name}) => name);
  const oldNames = filterCookieNames(requestCookies, namePrefix);
  const namesToDelete = oldNames.filter(name => !names.includes(name));
  namesToDelete.forEach(name => {
    serverResponse.setHeader('Set-Cookie', `${name}=; Max-Age=0; Path=/; HttpOnly;`);
  });
}
