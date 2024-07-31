
async function start () {
  const fastifyApp = require('./app')

  await fastifyApp.listen({ port: process.env.PORT || 80 })

  fastifyApp.ready(() => {
    if (process.env.NODE_ENV === 'development') {
      fastifyApp.log.info('\n' + fastifyApp.printRoutes({ commonPrefix: false }))
    }

    console.info(
      '\n=======================================================' +
      `\nDogfy API ready / Port: ${fastifyApp.server.address().port} / NODE_ENV: ${process.env.NODE_ENV}` +
      '\n=======================================================',
    )
  })

}

module.exports = { start }
