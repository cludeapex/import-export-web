export default {
  admin: {
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/',
        handler: 'controller.export',
        config: {
          policies: [],
          auth: false,
        },
      },
      {
        method: 'GET',
        path: '/settings',
        handler: 'controller.settings',
        config: {
          policies: [],
          auth: false,
        },
      },
      {
        method: 'POST',
        path: '/',
        handler: 'controller.import',
        config: {
          policies: ['isImportEnabled'],
          auth: false,
        },
        request: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  archive: {
                    type: 'string',
                    format: 'binary',
                  },
                },
                required: ['archive'],
              },
            },
          },
        },
      },
    ],
  },
};