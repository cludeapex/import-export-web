import { existsSync } from "fs";

export default ({ strapi }) => ({
  async run(filePath, includeFiles, encryptionKey) {
    try {
      const encryptionOption = encryptionKey
        ? `--key "${encryptionKey}"`
        : "--no-encrypt";

      const optionsString = includeFiles
        ? ''
        : '--exclude files';

      const command = `npx strapi export --file ${filePath} ${encryptionOption} ${optionsString}`.trim();

      await strapi
        .plugin('import-export-web')
        .service('service')
        .utils.execCommand(command);

      const finalPath = strapi
        .plugin('import-export-web')
        .service('service')
        .utils.withExt(filePath, !!encryptionKey);

      return existsSync(finalPath);
    } catch (error) {
      throw error;
    }
  },
});
