const bootstrap = ({ strapi }) => {
  const { tmpdir } = require('os');
  const { join } = require('path');
  const { mkdir } = require('fs');
  const { promisify } = require('util');
  
  const _mkdir = promisify(mkdir);
  const tempDir = join(tmpdir(), 'strapi-import-export');
  
  _mkdir(tempDir, { recursive: true }).catch(console.error);
  
  setTimeout(() => {
    try {
      const cleanupMiddleware = strapi.plugin('import-export-web').middleware('cleanup');
      if (cleanupMiddleware && cleanupMiddleware.initialize) {
        cleanupMiddleware.initialize();
      }
    } catch (error) {
      console.error('Cleanup middleware initialization error:', error);
    }
  }, 1000);
  
};

export default bootstrap;
