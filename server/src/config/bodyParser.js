export default {
  formidable: {
    maxFileSize: 2 * 1024 * 1024 * 1024,
    maxFields: 10,
    maxFieldsSize: 20 * 1024 * 1024,
    keepExtensions: true,
    allowEmptyFiles: false,
    minFileSize: 0,
    multiples: false,
    hashAlgorithm: false,
  },
  formLimit: '2gb',
  jsonLimit: '2gb',
  textLimit: '2gb',
};
