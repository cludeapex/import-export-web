const canExport = (ctx) => {
  return ctx.state.admin && ctx.state.admin.isActive;
};

const canImport = (ctx) => {
  return ctx.state.admin && ctx.state.admin.isActive;
};

export default {
  canExport,
  canImport,
};
