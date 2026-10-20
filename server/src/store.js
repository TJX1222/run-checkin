import fs from 'node:fs/promises';
import path from 'node:path';

const emptyDb = {
  users: [],
  runs: [],
  trackPoints: [],
};

export class JsonStore {
  constructor(file) {
    this.file = file;
  }

  async read() {
    try {
      const raw = await fs.readFile(this.file, 'utf8');
      const parsed = JSON.parse(raw);
      return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        runs: Array.isArray(parsed.runs) ? parsed.runs : [],
        trackPoints: Array.isArray(parsed.trackPoints) ? parsed.trackPoints : [],
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return structuredClone(emptyDb);
      }
      throw error;
    }
  }

  async write(db) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tempFile = `${this.file}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(db, null, 2), 'utf8');
    await fs.rename(tempFile, this.file);
  }

  async update(updater) {
    const db = await this.read();
    const result = await updater(db);
    await this.write(db);
    return result;
  }
}
