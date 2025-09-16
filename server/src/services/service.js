import exportService from './export';
import importService from './import';
import utilsService from './utils';
import fileManagerService from './fileManager';

const service = ({ strapi }) => ({
  getWelcomeMessage() {
    return 'Welcome to Import/Export Web Plugin!';
  },
  
  export: exportService({ strapi }),
  import: importService({ strapi }),
  utils: utilsService({ strapi }),
  fileManager: fileManagerService({ strapi }),
});

export default service;
