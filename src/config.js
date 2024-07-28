// API prefix depending on environment
const config = {}

config.apiPrefix = {
  development: '/api-v1',
  staging: '/v1',
  production: '/v1',
  test: '',
}


module.exports = config
