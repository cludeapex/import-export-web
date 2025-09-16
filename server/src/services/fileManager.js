import { existsSync, statSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const _unlink = promisify(require('fs').unlink);

export default ({ strapi }) => ({
  async createTempFile(prefix = 'strapi-') {
    const tempDir = strapi.plugin('import-export-web').service('service').utils.getTempDir();
    const fileName = `${prefix}${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return join(tempDir, fileName);
  },

  async cleanupFile(filePath) {
    try {
      if (existsSync(filePath)) {
        await _unlink(filePath);
        return true;
      }
    } catch (error) {
      console.error('File cleanup error:', error);
    }
    return false;
  },

  getFileStats(filePath) {
    if (!existsSync(filePath)) return null;
    
    const stats = statSync(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  },

  async getTempDirStats() {
    const tempDir = strapi.plugin('import-export-web').service('service').utils.getTempDir();
    if (!existsSync(tempDir)) return { files: 0, totalSize: 0 };

    const files = readdirSync(tempDir);
    let totalSize = 0;
    let fileCount = 0;

    for (const file of files) {
      const filePath = join(tempDir, file);
      const stats = this.getFileStats(filePath);
      if (stats && stats.isFile) {
        totalSize += stats.size;
        fileCount++;
      }
    }

    return { files: fileCount, totalSize };
  },

  async cleanupAll() {
    const tempDir = strapi.plugin('import-export-web').service('service').utils.getTempDir();
    if (!existsSync(tempDir)) return 0;

    const files = readdirSync(tempDir);
    let cleanedCount = 0;

    for (const file of files) {
      const filePath = join(tempDir, file);
      if (await this.cleanupFile(filePath)) {
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
});
