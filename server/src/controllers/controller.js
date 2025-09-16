import { randomUUID } from "crypto";
import { createReadStream, existsSync } from "fs";
import { join, dirname } from "path";
import { rename } from "fs/promises";

const controller = ({ strapi }) => ({
  index(ctx) {
    ctx.body = strapi.plugin('import-export-web').service('service').getWelcomeMessage();
  },

  async export(ctx) {
    try {
      const tempDir = strapi.plugin('import-export-web').service('service').utils.getTempDir();

      await strapi.plugin('import-export-web').service('service').utils.mkdirp(tempDir);

      const filePath = await strapi.plugin('import-export-web').service('service').fileManager.createTempFile('export-');
      const projectName = strapi.plugin('import-export-web').service('service').utils.getProjectName();
      const archiveName = projectName || "export";
      const fileName = [archiveName, new Date().toISOString()].join("-");
      const encryptionKey = strapi.plugin('import-export-web').config("encryptionKey", undefined);

      const includeFiles = ctx.query.includeFiles === 'true';

      const success = await strapi
        .plugin('import-export-web')
        .service('service')
        .export.run(filePath, includeFiles, encryptionKey);

      if (!success) throw new Error("Export failed");

      const finalFileName = strapi.plugin('import-export-web').service('service').utils.withExt(filePath, !!encryptionKey);
      const downloadFileName = strapi.plugin('import-export-web').service('service').utils.withExt(fileName, !!encryptionKey);

      if (!existsSync(finalFileName)) throw new Error(`Export file not found: ${finalFileName}`);

      ctx.attachment(downloadFileName);
      ctx.set("access-control-expose-headers", "content-disposition");
      ctx.set("content-disposition", `attachment; filename=${downloadFileName}`);
      ctx.set("content-type", "application/tar+gzip");
      ctx.body = createReadStream(finalFileName);
    } catch (err) {
      ctx.status = 500;
      ctx.body = { error: err.message || 'Export failed' };
    }
  },

  async import(ctx) {
    const startTime = Date.now();

    try {
      const { files = {}, body = {} } = ctx.request;
      const { archive } = files;
      if (!archive?.filepath) throw new Error("Missing uploaded archive file");

      const config = strapi.plugin('import-export-web').config() || {};
      const maxFileSize = config.maxFileSize || 2 * 1024 * 1024 * 1024;
      if (archive.size > maxFileSize) {
        throw new Error(`File too large. Maximum allowed size: ${Math.round(maxFileSize / 1024 / 1024)}MB, received: ${Math.round(archive.size / 1024 / 1024)}MB`);
      }

      const originalName = archive.originalFilename || archive.name || 'import.tar.gz';
      const tempDir = dirname(archive.filepath);
      const renamedFilePath = join(tempDir, originalName);
      await rename(archive.filepath, renamedFilePath);

      const encryptionKey = strapi.plugin('import-export-web').config("encryptionKey", undefined);

      let excludeTypes = [];
      let onlyTypes = [];

      try { if (body.exclude && typeof body.exclude === 'string') excludeTypes = JSON.parse(body.exclude); }
      catch (err) { console.warn('Failed to parse exclude:', err.message); }

      try { if (body.only && typeof body.only === 'string') onlyTypes = JSON.parse(body.only); }
      catch (err) { console.warn('Failed to parse only:', err.message); }


      const includeFiles = body.includeFiles === 'true';
      if (!includeFiles && !excludeTypes.includes('files')) {
        excludeTypes.push('files');
      }

      const importOptions = {
        skipAssets: body.skipAssets === 'true' || body.skipAssets === true || body.skipAssets === 'on',
        exclude: excludeTypes,
        only: onlyTypes
      };

      const success = await strapi.plugin('import-export-web').service('service').import.run(
        renamedFilePath,
        importOptions,
        encryptionKey
      );

      const executionTime = Date.now() - startTime;

      ctx.status = success ? 200 : 400;
      ctx.body = success
        ? { message: "Import completed successfully", executionTime: `${Math.round(executionTime / 1000)}s` }
        : { error: "Import failed" };

    } catch (err) {
      const executionTime = Date.now() - startTime;
      console.error(`Import failed after ${executionTime}ms:`, err.message);
      ctx.status = 500;
      ctx.body = { error: err.message || 'Import failed', executionTime: `${Math.round(executionTime / 1000)}s` };
    }
  },
});

export default controller;
