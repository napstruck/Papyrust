import NodeCache from 'node-cache';

type Resolver = () => void;

class SafeNodeCache {
  private cache: NodeCache;
  private locks: Map<string, Resolver[]>;

  /**
   * Creates an instance of SafeNodeCache.
   */
  constructor() {
    this.cache = new NodeCache();
    this.locks = new Map<string, Resolver[]>();
  }

  /**
   * Acquires a lock for a specific key.
   * If the key is already locked, it waits until the lock is released.
   *
   * @private
   * @param {string} key - The key to acquire a lock for.
   * @returns {Promise<void>} A promise that resolves when the lock is acquired.
   */
  private async _acquireLock(key: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.locks.has(key)) {
        this.locks.set(key, []);
        resolve();
      } else {
        this.locks.get(key)?.push(resolve);
      }
    });
  }

  /**
   * Releases the lock for a specific key.
   * If there are pending operations in the queue, it resolves the next promise.
   *
   * @private
   * @param {string} key - The key to release the lock for.
   */
  private _releaseLock(key: string): void {
    const queue = this.locks.get(key);
    if (queue && queue.length > 0) {
      const next = queue.shift();
      if (next) {
        next();
      }
    } else {
      this.locks.delete(key);
    }
  }

  /**
   * Retrieves the value associated with the given key from the cache.
   *
   * @param {string} key - The key to retrieve the value for.
   * @returns {Promise<T | undefined>} A promise that resolves to the value associated with the key, or undefined if the key does not exist.
   */
  async get<T>(key: string): Promise<T | undefined> {
    await this._acquireLock(key);
    try {
      return this.cache.get<T>(key);
    } finally {
      this._releaseLock(key);
    }
  }

  /**
   * Sets a value for the given key in the cache.
   *
   * @param {string} key - The key to set the value for.
   * @param {T} value - The value to set.
   * @returns {Promise<boolean>} A promise that resolves to true if the value was set successfully.
   */
  async set<T>(key: string, value: T): Promise<boolean> {
    await this._acquireLock(key);
    try {
      return this.cache.set<T>(key, value);
    } finally {
      this._releaseLock(key);
    }
  }

  /**
   * Deletes the value associated with the given key from the cache.
   *
   * @param {string} key - The key to delete the value for.
   * @returns {Promise<number>} A promise that resolves to the number of deleted entries.
   */
  async del(key: string): Promise<number> {
    await this._acquireLock(key);
    try {
      return this.cache.del(key);
    } finally {
      this._releaseLock(key);
    }
  }

  /**
   * Retrieves the value associated with the given key from the cache.
   * If the key does not exist, it calls the valueFunction to set a new value in the cache.
   *
   * @param {string} key - The key to retrieve or set the value for.
   * @param {() => Promise<T>} valueFunction - A function that returns a promise resolving to the value to set if the key does not exist.
   * @returns {Promise<T>} A promise that resolves to the value associated with the key.
   */
  async getOrSet<T>(key: string, valueFunction: () => Promise<T>): Promise<T> {
    await this._acquireLock(key);
    try {
      let value = this.cache.get<T>(key);
      if (value === undefined) {
        value = await valueFunction();
        this.cache.set<T>(key, value);
      }
      return value;
    } finally {
      this._releaseLock(key);
    }
  }
}

export default SafeNodeCache;
