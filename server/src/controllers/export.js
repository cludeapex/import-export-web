import { randomUUID } from "crypto";
import { createReadStream } from "fs";
import { join } from "path";

const ARCHIVE_DIR = "./.tmp/";

export default ({ strapi }) => ({
  async handler(ctx) {
    try {
      const includeFiles = ctx.query.includeFiles === 'true';
      
      const optionsEnabled = includeFiles 
        ? ["config", "content", "files"]
        : ["config", "content"];

      await strapi
        .plugin('import-export-web')
        .service('utils')
        .mkdirp(ARCHIVE_DIR);

      const filePath = join(ARCHIVE_DIR, randomUUID());

      const projectName = strapi
        .plugin('import-export-web')
        .service('utils')
        .getProjectName();

      const archiveName = projectName || "export";

      const fileName = [
        archiveName,
        optionsEnabled.join("-"),
        new Date().toISOString(),
      ].join("-");

      const encryptionKey = strapi
        .plugin('import-export-web')
        .config("encryptionKey", undefined);

      const success = await strapi
        .plugin('import-export-web')
        .service('export')
        .run(filePath, optionsEnabled, encryptionKey);

      if (!success) {
        throw new Error("Export failed");
      }

      const finalFileName = strapi
        .plugin('import-export-web')
        .service('utils')
        .withExt(fileName, !!encryptionKey);

      ctx.attachment(finalFileName);
      ctx.set("access-control-expose-headers", "content-disposition");
      ctx.set("content-disposition", `attachment; filename=${finalFileName}`);
      ctx.set("content-type", "application/tar+gzip");
      
      ctx.body = createReadStream(finalFileName);
    } catch (err) {
      console.error('Export error:', err);
      ctx.status = 500;
      ctx.body = { error: err.message || 'Export failed' };
    }
  },
});
