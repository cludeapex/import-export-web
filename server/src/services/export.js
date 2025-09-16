import { existsSync } from "fs";

export default ({ strapi }) => ({
  async run(filePath, options, encryptionKey) {
    try {
      const encryptionOption = encryptionKey ? `--key "${encryptionKey}"` : "--no-encrypt";
      
      let optionsString = '';
      if (options && Array.isArray(options) && options.length > 0) {
        const validOptions = options.filter(opt => 
          ['config', 'content', 'files'].includes(opt)
        );
        if (validOptions.length > 0) {
          optionsString = `--only ${validOptions.join(',')}`;
        }
      }
      
      const command = `npx strapi export --file ${filePath} ${encryptionOption} ${optionsString}`.trim();

      await strapi.plugin('import-export-web').service('service').utils.execCommand(command);

      const finalPath = strapi.plugin('import-export-web').service('service').utils.withExt(filePath, !!encryptionKey);
      return existsSync(finalPath);
    } catch (error) {
      throw error;
    }
  },
});