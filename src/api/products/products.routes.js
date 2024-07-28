const productsHandlers = require('./products.handlers')

async function routes (fastify) {
  fastify.get('/', productsHandlers.getCoffeeMachines)
}

module.exports = routes
