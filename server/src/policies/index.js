const canExport = (ctx) => {
  return ctx.state.admin && ctx.state.admin.isActive;
};

const canImport = (ctx) => {
  return ctx.state.admin && ctx.state.admin.isActive;
};

const isImportEnabled = (ctx) => {
  const isImportEnabled = !!strapi.plugin('import-export-web').config('enableImport', false);
  if (!isImportEnabled) {
    ctx.status = 403;
    ctx.body = { error: 'Import is disabled by configuration' };
    return false;
  }
  return true;
};

export default {
  canExport,
  canImport,
  isImportEnabled,
};
