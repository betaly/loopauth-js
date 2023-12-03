import {ClientStorage} from './storage';

const TRANSACTION_STORAGE_KEY_PREFIX = 'ma.spajs.txs';

interface Transaction {
  audience?: string;
  appState?: any;
  client_verifier?: string;
  redirect_uri?: string;
}

export class TransactionManager {
  private readonly storageKey: string;

  constructor(
    private storage: ClientStorage,
    private clientId: string,
  ) {
    this.storageKey = `${TRANSACTION_STORAGE_KEY_PREFIX}.${this.clientId}`;
  }

  public async create(transaction: Transaction) {
    await this.storage.set(this.storageKey, transaction, {
      daysUntilExpire: 1,
    });
  }

  public async get(): Promise<Transaction | undefined> {
    return this.storage.get(this.storageKey);
  }

  public async remove() {
    await this.storage.remove(this.storageKey);
  }
}
