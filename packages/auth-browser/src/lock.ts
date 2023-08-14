// import SuperTokensLock from 'browser-tabs-lock';

let globalLock: NoopLock;

export interface Lock {
  acquireLock(lockKey: string, timeout?: number): Promise<boolean>;
  releaseLock(lockKey: string): Promise<void>;
}

export class NoopLock implements Lock {
  async acquireLock(lockKey: string, timeout?: number): Promise<boolean> {
    return true;
  }

  public async releaseLock(lockKey: string) {
    return;
  }
}

export default async function acquireLock() {
  if (globalLock === undefined) {
    globalLock = new NoopLock();
  }
  return globalLock;
}
