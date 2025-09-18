export default ({ strapi }) => ({
  async run(filePath, options, encryptionKey) {
    try {
      const encryptionOption = encryptionKey ? `--key "${encryptionKey}"` : "";
      const skipAssets = options?.skipAssets || false;

      let excludeOption = '';
      let onlyOption = '';

      if (options?.exclude && Array.isArray(options.exclude) && options.exclude.length > 0) {
        const validExcludeTypes = options.exclude.filter(type =>
          ['content', 'files', 'config'].includes(type)
        );
        if (validExcludeTypes.length > 0) {
          excludeOption = `--exclude ${validExcludeTypes.join(',')}`;
        }
      }

      if (options?.only && Array.isArray(options.only) && options.only.length > 0) {
        const validOnlyTypes = options.only.filter(type =>
          ['content', 'files', 'config'].includes(type)
        );
        if (validOnlyTypes.length > 0) {
          onlyOption = `--only ${validOnlyTypes.join(',')}`;
        }
      }

      const includeFiles = options?.includeFiles === true || options?.includeFiles === 'true';
      console.log(`[IMPORT] includeFiles evaluation: options.includeFiles="${options?.includeFiles}" (${typeof options?.includeFiles}) -> includeFiles=${includeFiles}`);
      console.log(`[IMPORT] Before exclude logic: excludeOption="${excludeOption}" onlyOption="${onlyOption}"`);
      
      if (!includeFiles && !excludeOption && !onlyOption) {
        excludeOption = '--exclude files';
        console.log(`[IMPORT] Added exclude files because includeFiles=${includeFiles}`);
      }

      const command = `npx strapi import --force --file "${filePath}" ${encryptionOption} ${excludeOption} ${onlyOption}`.trim();

      console.log(`[IMPORT] Executing command: ${command}`);

      const { stdout, stderr } = await strapi.plugin('import-export-web').service('service').utils.execCommand(command);

      if (stdout) {
        console.log(`[IMPORT] Command stdout:`, stdout);
      }
      if (stderr) {
        console.log(`[IMPORT] Command stderr:`, stderr);
      }

      const success = stdout.includes("completed successfully") ||
        stdout.includes("Import completed") ||
        stdout.includes("successfully") ||
        stderr.includes("transferred") || 
        (!stderr && stdout.length > 0);

      return success;
    } catch (error) {
      console.error('Import process failed:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        signal: error.signal,
        killed: error.killed
      });
      throw new Error(`Import failed: ${error.message}`);
    }
  },
});
