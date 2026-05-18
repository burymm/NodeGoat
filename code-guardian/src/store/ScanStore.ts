import { Db } from 'mongodb';
import { Scan } from '../types';

export class ScanStore {
  private collection = 'codeGuardian.scans';

  constructor(private db: Db) {}

  async create(scan: Scan): Promise<void> {
    await this.db.collection(this.collection).insertOne(scan);
  }

  async update(scanId: string, update: Partial<Scan>): Promise<void> {
    await this.db.collection(this.collection).updateOne(
      { scanId },
      { $set: update },
    );
  }

  async findById(scanId: string): Promise<Scan | null> {
    return this.db.collection(this.collection).findOne<Scan>(
      { scanId },
    );
  }

  async findAll(): Promise<Scan[]> {
    return this.db.collection(this.collection).find<Scan>(
      {},
      { sort: { createdAt: -1 } },
    ).toArray();
  }
}
