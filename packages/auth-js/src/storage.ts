export interface ClientStorageOptions {
  daysUntilExpire?: number;
  cookieDomain?: string;
}

/**
 * Defines a type that handles storage to/from a storage location
 */
export interface ClientStorage {
  get<T extends object>(key: string): Promise<T | undefined>;

  set(key: string, value: any, options?: ClientStorageOptions): Promise<void>;

  remove(key: string, options?: ClientStorageOptions): Promise<void>;
}

export class InMemoryStorage implements ClientStorage {
  private storage = new Map<string, any>();

  async get<T extends object>(key: string): Promise<T | undefined> {
    return this.storage.get(key);
  }

  async remove(key: string, options?: ClientStorageOptions): Promise<void> {
    this.storage.delete(key);
  }

  async set(key: string, value: any, options?: ClientStorageOptions): Promise<void> {
    this.storage.set(key, value);
  }
}
