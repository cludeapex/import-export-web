import { dirname, join } from "path";
import { rename } from "fs/promises";

export default ({ strapi }) => ({
  async handler(ctx) {
    try {
      const { files = {}, body = {} } = ctx.request;
      
      const { archive } = files;

      if (!archive?.path) {
        throw new Error("Missing uploaded archive file");
      }

      const filePath = join(dirname(archive.path), archive.name);

      const encryptionKey = strapi
        .plugin('import-export-web')
        .config("encryptionKey", undefined);

      await rename(archive.path, filePath);

      const options = {
        skipAssets: body.skipAssets === 'true' || body.skipAssets === true
      };

      if (body.exclude) {
        try {
          options.exclude = typeof body.exclude === 'string' 
            ? JSON.parse(body.exclude) 
            : body.exclude;
        } catch (e) {
          console.warn('Failed to parse exclude parameter:', e);
        }
      }

      const success = await strapi
        .plugin('import-export-web')
        .service('import')
        .run(filePath, options, encryptionKey);

      if (success) {
        ctx.status = 200;
        ctx.body = { message: "Import completed successfully" };
      } else {
        ctx.status = 400;
        ctx.body = { error: "Import failed" };
      }
    } catch (err) {
      console.error('Import error:', err);
      ctx.status = 500;
      ctx.body = { error: err.message || 'Import failed' };
    }
  },
});
