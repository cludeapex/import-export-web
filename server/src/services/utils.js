import { exec } from "child_process";
import { mkdir, readFileSync, existsSync, statSync } from "fs";
import { join, dirname } from "path";
import { promisify } from "util";
import { tmpdir } from "os";

const _exec = promisify(exec);
const _mkdir = promisify(mkdir);

export default ({ strapi }) => ({
  getTempDir() {
    try {
      const config = strapi.plugin('import-export-web').config();
      if (config && config.tempDir) {
        return config.tempDir;
      }
    } catch (error) {
    }
    return join(tmpdir(), 'strapi-import-export');
  },

  getStrapiCommand(baseCommand) {
    const isWindows = process.platform === 'win32';
    const isDocker = process.env.DOCKER === 'true' || process.env.NODE_ENV === 'docker';
    
    if (isDocker || !isWindows) {
      return `npx strapi ${baseCommand}`;
    } else {
      return `npx.cmd strapi ${baseCommand}`;
    }
  },

  async execCommand(command) {
    try {
      const crossPlatformCommand = command.replace(/npx\s+strapi/g, this.getStrapiCommand(''));
      
      
      const stds = await _exec(crossPlatformCommand, {
        cwd: process.cwd(),
        env: { ...process.env },
        timeout: 1800000, // 30 минут вместо 5
      });
      
      return stds;
    } catch (error) {
      console.error('Command execution error:', error);
      throw error;
    }
  },

  async mkdirp(path) {
    try {
      await _mkdir(path, { recursive: true });
      return true;
    } catch (error) {
      console.error('Directory creation error:', error);
      return false;
    }
  },

  getProjectName() {
    try {
      const packageJsonPath = join(process.cwd(), "package.json");
      const packageJson = readFileSync(packageJsonPath, "utf-8");
      const parsed = JSON.parse(packageJson);
      return parsed.name;
    } catch (error) {
      console.error('Error reading package.json:', error);
      return undefined;
    }
  },

  withExt(fileName, encrypted = false) {
    const TARBALL_EXT = ".tar.gz";
    const ENCRYPTED_TARBALL_EXT = ".tar.gz.enc";
    
    return fileName + (encrypted ? ENCRYPTED_TARBALL_EXT : TARBALL_EXT);
  },

  async cleanupOldFiles() {
    try {
      let config;
      try {
        config = strapi.plugin('import-export-web').config();
      } catch (error) {
        config = { autoCleanup: true, maxFileAge: 7 * 24 * 60 * 60 * 1000 };
      }
      
      if (!config.autoCleanup) return;

      const tempDir = this.getTempDir();
      if (!existsSync(tempDir)) return;

      const files = await promisify(require('fs').readdir)(tempDir);
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = join(tempDir, file);
        const stats = statSync(filePath);
        
        if (now - stats.mtime.getTime() > config.maxFileAge) {
          await promisify(require('fs').unlink)(filePath);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
      }
    } catch (error) {
      console.error('Auto-cleanup error:', error);
    }
  },
});
