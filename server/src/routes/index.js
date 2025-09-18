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
        method: 'POST',
        path: '/',
        handler: 'controller.import',
        config: {
          policies: [],
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
      {
        method: 'GET',
        path: '/status/:jobId',
        handler: 'controller.status',
        config: {
          policies: [],
          auth: false,
        },
      },
    ],
  },
};