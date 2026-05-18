declare module 'mongodb' {
  export class Db {
    collection(name: string): Collection;
  }

  export interface Collection {
    insertOne(doc: any): Promise<any>;
    updateOne(filter: any, update: any): Promise<any>;
    findOne<T>(filter: any): Promise<T | null>;
    find<T>(filter: any, options?: any): { toArray(): Promise<T[]> };
  }

  export class MongoClient {
    static connect(url: string, callback: (err: any, db: Db) => void): void;
  }
}
