import {ClientStorage} from './storage';

const TRANSACTION_STORAGE_KEY_PREFIX = 'ma.spajs.txs';

interface Transaction {
  audience?: string;
  appState?: any;
  client_verifier?: string;
  redirect_uri?: string;
}

export class TransactionManager {
  private transaction: Transaction | undefined;
  private readonly storageKey: string;

  constructor(private storage: ClientStorage, private clientId: string) {
    this.storageKey = `${TRANSACTION_STORAGE_KEY_PREFIX}.${this.clientId}`;
    this.transaction = this.storage.get(this.storageKey);
  }

  public create(transaction: Transaction) {
    this.transaction = transaction;

    this.storage.save(this.storageKey, transaction, {
      daysUntilExpire: 1,
    });
  }

  public get(): Transaction | undefined {
    return this.transaction;
  }

  public remove() {
    delete this.transaction;
    this.storage.remove(this.storageKey);
  }
}
