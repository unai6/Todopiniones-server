const fastifyApp = require('./app')

async function start () {
  await fastifyApp.listen({ port: process.env.PORT || 80 })

  if (process.env.NODE_ENV === 'development') {
  }

  fastifyApp.ready(() => {
    console.info('\n' + fastifyApp.printRoutes({ commonPrefix: false }))
    console.info(
      '\n=======================================================' +
      `\nDogfy API ready / Port: ${fastifyApp.server.address().port} / NODE_ENV: ${process.env.NODE_ENV}` +
      '\n=======================================================',
    )
  })

}

module.exports = { start }
