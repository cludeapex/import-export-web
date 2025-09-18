export default {
  default: {
    tempDir: null,
    cleanupInterval: 24 * 60 * 60 * 1000,
    maxFileAge: 7 * 24 * 60 * 60 * 1000,
    maxFileSize: 2 * 1024 * 1024 * 1024,
    autoCleanup: true,
    enableImport: false,
  },
  validator(config) {
    if (config.tempDir && typeof config.tempDir !== 'string') {
      throw new Error('tempDir must be a string');
    }
    if (config.cleanupInterval && typeof config.cleanupInterval !== 'number') {
      throw new Error('cleanupInterval must be a number');
    }
    if (config.maxFileAge && typeof config.maxFileAge !== 'number') {
      throw new Error('maxFileAge must be a number');
    }
    if (config.maxFileSize && typeof config.maxFileSize !== 'number') {
      throw new Error('maxFileSize must be a number');
    }
    if (typeof config.autoCleanup !== 'boolean') {
      throw new Error('autoCleanup must be a boolean');
    }
    if (typeof config.enableImport !== 'boolean') {
      throw new Error('enableImport must be a boolean');
    }
  },
};