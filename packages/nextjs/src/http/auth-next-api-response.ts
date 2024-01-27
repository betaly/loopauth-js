import {NextApiResponse} from 'next';

import {NodeResponse} from '../auth-session/http';

export default class AuthNextApiResponse extends NodeResponse<NextApiResponse> {
  public redirect(location: string, status = 302): void {
    if (this.res.writableEnded) {
      return;
    }
    this.res.redirect(status, (this.res.getHeader('Location') as string) || location);
  }
}
