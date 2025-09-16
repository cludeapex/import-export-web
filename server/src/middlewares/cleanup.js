export default ({ strapi }) => {
  let cleanupInterval;

  return {
    async initialize() {
      const config = strapi.plugin('import-export-web').config() || {};
      if (!config.autoCleanup) return;

      const interval = config.cleanupInterval || 24 * 60 * 60 * 1000;
      
      cleanupInterval = setInterval(async () => {
        try {
          await strapi.plugin('import-export-web').service('service').utils.cleanupOldFiles();
        } catch (error) {
          console.error('Scheduled cleanup error:', error);
        }
      }, interval);

    },

    async destroy() {
      if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
      }
    }
  };
};
