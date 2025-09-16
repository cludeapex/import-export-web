# Import Export Web

A Strapi 5 plugin that provides a web interface for importing and exporting your Strapi data.

## Features

- 📦 **Full Data Export** - Export all your Strapi data (content, configuration, files)
- 📥 **Easy Import** - Import data from exported archives
- 🎨 **Web Interface** - User-friendly admin panel interface
- 🔄 **Auto Cleanup** - Automatic cleanup of temporary files
- 🐳 **Docker Ready** - Works in Docker and Docker Swarm
- 🌍 **Cross Platform** - Supports Windows, Linux, and macOS
- 📁 **Large Files** - Supports files up to 1GB by default

## Installation

```bash
npm install import-export-web
```

or

```bash
yarn add import-export-web
```

## Configuration

Add the plugin to your `config/plugins.js`:

```javascript
module.exports = {
  'import-export-web': {
    enabled: true,
    resolve: './node_modules/import-export-web'
  }
};
```

## Usage

1. Start your Strapi application
2. Go to **Settings** → **Import Export Web** in the admin panel
3. Use the **Export** tab to download your data
4. Use the **Import** tab to upload and restore data

## Configuration Options

You can configure the plugin in `config/plugins.js`:

```javascript
module.exports = {
  'import-export-web': {
    enabled: true,
    resolve: './node_modules/import-export-web',
    config: {
      tempDir: '/custom/temp/path',        // Custom temp directory
      cleanupInterval: 24 * 60 * 60 * 1000, // Cleanup interval (24h)
      maxFileAge: 7 * 24 * 60 * 60 * 1000,  // Max file age (7 days)
      maxFileSize: 1024 * 1024 * 1024,       // Max file size (1GB)
      autoCleanup: true                     // Enable auto cleanup
    }
  }
};
```

## Requirements

- Strapi 5.x
- Node.js 18+
- npm 8+

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues, please [create an issue](https://github.com/cludeapex/import-export-web/issues) on GitHub.