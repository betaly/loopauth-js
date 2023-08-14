export interface ClientStorageOptions {
  daysUntilExpire?: number;
  cookieDomain?: string;
}

/**
 * Defines a type that handles storage to/from a storage location
 */
export interface ClientStorage {
  get<T extends object>(key: string): T | undefined;

  save(key: string, value: any, options?: ClientStorageOptions): void;

  remove(key: string, options?: ClientStorageOptions): void;
}

export class InMemoryStorage implements ClientStorage {
  private storage = new Map<string, any>();

  get<T extends object>(key: string): T | undefined {
    return this.storage.get(key);
  }

  remove(key: string, options?: ClientStorageOptions): void {
    this.storage.delete(key);
  }

  save(key: string, value: any, options?: ClientStorageOptions): void {
    this.storage.set(key, value);
  }
}
