require('dotenv').config();

const config = {
  mongodb: {
    url: process.env.MONGODB_URI,
    options: {}
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'commonjs',
};

module.exports = config;
