import { randomUUID } from "crypto";
import { createReadStream, existsSync } from "fs";
import { join, dirname } from "path";
import { rename } from "fs/promises";

const runExportJob = async (jobId, queryParams, strapi) => {
  const jobManager = strapi.plugin('import-export-web').service('jobManager');
  const startTime = Date.now();
  
  try {
    console.log(`[EXPORT ${jobId}] Initializing...`);
    jobManager.setJobProgress(jobId, 10, 'Initializing export...');
    
    const tempDir = strapi.plugin('import-export-web').service('service').utils.getTempDir();
    await strapi.plugin('import-export-web').service('service').utils.mkdirp(tempDir);
    
    console.log(`[EXPORT ${jobId}] Creating temp file in ${tempDir}...`);
    jobManager.setJobProgress(jobId, 20, 'Creating temporary file...');
    
    const filePath = await strapi.plugin('import-export-web').service('service').fileManager.createTempFile('export-');
    const projectName = strapi.plugin('import-export-web').service('service').utils.getProjectName();
    const archiveName = projectName || "export";
    const fileName = [archiveName, new Date().toISOString()].join("-");
    const encryptionKey = strapi.plugin('import-export-web').config("encryptionKey", undefined);
    
    const includeFiles = queryParams.includeFiles === 'true';
    console.log(`[EXPORT ${jobId}] Starting export: includeFiles=${includeFiles} encrypted=${!!encryptionKey} project=${projectName}`);
    jobManager.setJobProgress(jobId, 30, 'Starting export process...');
    
    console.log(`[EXPORT ${jobId}] Calling export service...`);
    const success = await strapi
      .plugin('import-export-web')
      .service('service')
      .export.run(filePath, includeFiles, encryptionKey);
    console.log(`[EXPORT ${jobId}] Export service returned: ${success}`);

    if (!success) throw new Error("Export failed");
    
    console.log(`[EXPORT ${jobId}] Export completed, finalizing...`);
    jobManager.setJobProgress(jobId, 90, 'Finalizing...');

    const finalFileName = strapi.plugin('import-export-web').service('service').utils.withExt(filePath, !!encryptionKey);
    const downloadFileName = strapi.plugin('import-export-web').service('service').utils.withExt(fileName, !!encryptionKey);

    if (!existsSync(finalFileName)) throw new Error(`Export file not found: ${finalFileName}`);

    const duration = Date.now() - startTime;
    console.log(`[EXPORT ${jobId}] ✅ Completed successfully in ${Math.round(duration / 1000)}s - File: ${downloadFileName}`);
    jobManager.setJobCompleted(jobId, { 
      downloadUrl: `/admin/plugins/import-export-web/download/${downloadFileName}`,
      fileName: downloadFileName 
    });
    
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[EXPORT ${jobId}] ❌ Failed after ${Math.round(duration / 1000)}s:`, err.message);
    jobManager.setJobError(jobId, err);
  }
};

const runImportJob = async (jobId, archive, body, strapi) => {
  const jobManager = strapi.plugin('import-export-web').service('jobManager');
  const startTime = Date.now();
  
  try {
    console.log(`[IMPORT ${jobId}] Starting validation...`);
    jobManager.setJobProgress(jobId, 5, 'Validating file...');
    
    const config = strapi.plugin('import-export-web').config() || {};
    const maxFileSize = config.maxFileSize || 2 * 1024 * 1024 * 1024;
    if (archive.size > maxFileSize) {
      throw new Error(`File too large. Maximum allowed size: ${Math.round(maxFileSize / 1024 / 1024)}MB, received: ${Math.round(archive.size / 1024 / 1024)}MB`);
    }

    console.log(`[IMPORT ${jobId}] File validated, preparing...`);
    jobManager.setJobProgress(jobId, 15, 'Preparing file...');

    const originalName = archive.originalFilename || archive.name || 'import.tar.gz';
    const tempDir = dirname(archive.filepath);
    const renamedFilePath = join(tempDir, originalName);
    await rename(archive.filepath, renamedFilePath);

    console.log(`[IMPORT ${jobId}] File prepared at ${renamedFilePath}, reading config...`);
    jobManager.setJobProgress(jobId, 25, 'Reading configuration...');

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
      includeFiles: includeFiles,
      skipAssets: body.skipAssets === 'true' || body.skipAssets === true || body.skipAssets === 'on',
      exclude: excludeTypes,
      only: onlyTypes
    };

    console.log(`[IMPORT ${jobId}] Config: exclude=[${excludeTypes.join(',')}] includeFiles=${includeFiles} skipAssets=${importOptions.skipAssets} encrypted=${!!encryptionKey}`);
    jobManager.setJobProgress(jobId, 35, 'Unpacking...');

    console.log(`[IMPORT ${jobId}] Calling import service...`);
    const success = await strapi.plugin('import-export-web').service('service').import.run(
      renamedFilePath,
      importOptions,
      encryptionKey
    );
    console.log(`[IMPORT ${jobId}] Import service returned: ${success}`);

    if (!success) throw new Error("Import failed");

    const duration = Date.now() - startTime;
    console.log(`[IMPORT ${jobId}] ✅ Completed successfully in ${Math.round(duration / 1000)}s`);
    jobManager.setJobCompleted(jobId, { message: "Import completed successfully" });
    
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[IMPORT ${jobId}] ❌ Failed after ${Math.round(duration / 1000)}s:`, err.message);
    jobManager.setJobError(jobId, err);
  }
};

const controller = ({ strapi }) => ({
  index(ctx) {
    ctx.body = strapi.plugin('import-export-web').service('service').getWelcomeMessage();
  },

  async status(ctx) {
    const { jobId } = ctx.params;
    console.log('SSE request for jobId:', jobId);
    
    const jobManager = strapi.plugin('import-export-web').service('jobManager');
    const job = jobManager.getJob(jobId);
    
    console.log('Job found:', !!job);
    if (job) {
      console.log('Job status:', job.status, 'progress:', job.progress);
    }
    
    if (!job) {
      console.log('Job not found for ID:', jobId);
      ctx.status = 404;
      ctx.body = { error: 'Job not found' };
      return;
    }

    ctx.status = 200;
    ctx.set('Content-Type', 'text/event-stream');
    ctx.set('Cache-Control', 'no-cache');
    ctx.set('Connection', 'keep-alive');
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Headers', 'Cache-Control');
    
    // Для SSE нужно отключить автоматическое завершение ответа
    ctx.respond = false;

    console.log('SSE connection established for job:', jobId);

    const sendEvent = (data) => {
      try {
        ctx.res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        console.error('Error sending SSE event:', err);
      }
    };

    let pingInterval;
    let checkInterval;

    const cleanup = () => {
      if (pingInterval) clearInterval(pingInterval);
      if (checkInterval) clearInterval(checkInterval);
      ctx.res.end();
    };

    // Пинг каждые 25 секунд
    pingInterval = setInterval(() => {
      sendEvent({ type: 'ping', timestamp: Date.now() });
    }, 25000);

    // Проверка статуса каждые 500мс
    checkInterval = setInterval(() => {
      const currentJob = strapi.plugin('import-export-web').service('jobManager').getJob(jobId);
      
      if (!currentJob) {
        sendEvent({ type: 'error', message: 'Job not found' });
        cleanup();
        return;
      }

      sendEvent({
        type: 'progress',
        status: currentJob.status,
        progress: currentJob.progress,
        message: currentJob.message,
        timestamp: Date.now()
      });

      if (currentJob.status === 'completed') {
        sendEvent({
          type: 'finished',
          result: currentJob.result,
          timestamp: Date.now()
        });
        cleanup();
      } else if (currentJob.status === 'error') {
        sendEvent({
          type: 'error',
          error: currentJob.error,
          timestamp: Date.now()
        });
        cleanup();
      }
    }, 500);

    // Отправляем начальное состояние
    sendEvent({
      type: 'progress',
      status: job.status,
      progress: job.progress,
      message: job.message,
      timestamp: Date.now()
    });

    ctx.req.on('close', cleanup);
    ctx.req.on('error', cleanup);
  },

  async export(ctx) {
    const useSSE = ctx.query.sse === 'true';
    
    if (useSSE) {
      // Создаем задачу и возвращаем jobId
      const jobId = strapi.plugin('import-export-web').service('jobManager').createJob('export', {
        includeFiles: ctx.query.includeFiles === 'true'
      });
      
      console.log(`[EXPORT] Started job ${jobId} - Include files: ${ctx.query.includeFiles === 'true'}`);
      
      // Запускаем экспорт в фоне
      setImmediate(() => runExportJob(jobId, ctx.query, strapi));
      
      ctx.body = { jobId };
      return;
    }

    // Обычный синхронный экспорт
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
    const { files = {}, body = {} } = ctx.request;
    const { archive } = files;
    const useSSE = body.sse === 'true';
    
    if (useSSE) {
      // Создаем задачу и возвращаем jobId
      if (!archive?.filepath) throw new Error("Missing uploaded archive file");
      
      const jobManager = strapi.plugin('import-export-web').service('jobManager');
      const jobId = jobManager.createJob('import', {
        filePath: archive.filepath,
        originalName: archive.originalFilename || archive.name || 'import.tar.gz',
        size: archive.size,
        body
      });
      
      console.log(`[IMPORT] Started job ${jobId} - File: ${archive.originalFilename || archive.name} (${Math.round(archive.size / 1024)}KB)`);
      console.log(`[IMPORT] Body parameters:`, {
        includeFiles: body.includeFiles,
        includeFilesType: typeof body.includeFiles,
        skipAssets: body.skipAssets,
        skipAssetsType: typeof body.skipAssets,
        exclude: body.exclude,
        only: body.only
      });
      
      // Запускаем импорт в фоне
      setImmediate(() => runImportJob(jobId, archive, body, strapi));
      
      ctx.body = { jobId };
      return;
    }

    // Обычный синхронный импорт
    const startTime = Date.now();

    try {
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
