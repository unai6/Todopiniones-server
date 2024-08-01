const productsHandlers = require('./products.handlers')

async function routes (fastify) {
  fastify.get('/', productsHandlers.getProducts)
}

module.exports = routes
