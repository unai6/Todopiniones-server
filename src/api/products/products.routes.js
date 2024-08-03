const productsHandlers = require('./products.handlers')

async function routes (fastify) {
  fastify.get('/', productsHandlers.getScrapedProducts)
}

module.exports = routes
