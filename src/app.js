// Require the framework and instantiate it
const fastify = require('fastify')({ logger: false, ignoreTrailingSlash: true })
const autoload = require('@fastify/autoload')

const path = require('path')

// Global vars. Mainly used for config options to be accessible everywhere.
global.config = require('./config')

// Register all services in 'api' folder (recursively).

fastify.register(require('@fastify/cors'), {})

fastify.register(autoload, {
  dir: path.join(__dirname, 'api'),
  options: { prefix: global.config.apiPrefix[process.env.NODE_ENV] },
  ignorePattern: /.*(model|schema|service|handlers)\.js/,
})

// Run the server!
fastify.listen({ port: process.env.PORT }, (err) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  }
})

module.exports = fastify
