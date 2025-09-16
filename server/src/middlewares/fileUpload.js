export default ({ strapi }) => {
  return async (ctx, next) => {
    if (ctx.method === 'POST' && ctx.path === '/import-export-web') {
      const config = strapi.plugin('import-export-web').config() || {};
      const maxFileSize = config.maxFileSize || 2 * 1024 * 1024 * 1024;
      
      ctx.request.formidable = {
        ...ctx.request.formidable,
        uploadDir: strapi.plugin('import-export-web').service('service').utils.getTempDir(),
      };
      
    }
    
    await next();
  };
};
