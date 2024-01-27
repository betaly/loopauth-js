import {NextApiRequest} from 'next';

import {AuthRequest} from '../auth-session/http';

export default class AuthNextApiRequest extends AuthRequest<NextApiRequest> {
  public constructor(req: NextApiRequest) {
    /* c8 ignore next */
    super(req);
  }

  public getUrl(): string {
    return this.req.url as string;
  }
  public getMethod(): string {
    return this.req.method as string;
  }
  public getBody(): Record<string, string> {
    return this.req.body;
  }
  public getCookies(): Record<string, string> {
    return this.req.cookies as Record<string, string>;
  }
}
