// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true, ignoreTrailingSlash: true })
const autoload = require('@fastify/autoload')

const path = require('path')

// Global vars. Mainly used for config options to be accessible everywhere.
global.config = require('./config')

fastify
.register(require('@fastify/cors'), {
  origin: true,
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Accept',
    'Content-Type',
    'Authorization'
  ],
  methods: ['GET', 'PUT', 'OPTIONS', 'POST', 'DELETE'],
})
.register(require('@fastify/sensible'))

// Register all services in 'api' folder (recursively).
fastify.register(autoload, {
  dir: path.join(__dirname, 'api'),
  options: { prefix: global.config.apiPrefix[process.env.NODE_ENV] },
  ignorePattern: /.*(model|schema|service|handlers)\.js/,
})

module.exports = fastify
