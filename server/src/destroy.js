const destroy = ({ strapi }) => {
  try {
    const cleanupMiddleware = strapi.plugin('import-export-web').middleware('cleanup');
    if (cleanupMiddleware && cleanupMiddleware.destroy) {
      cleanupMiddleware.destroy();
    }
  } catch (error) {
    console.error('Cleanup middleware destroy error:', error);
  }
};

export default destroy;
