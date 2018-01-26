
console.log(`loading configuration (dev mode=${__DEV__})`);

const config = {
  // TODO: domain name of your heroku app, e.g.:
  API_BASE: 'https://meeting-assistant-rahul.herokuapp.com/',
  AUTH0_DOMAIN: 'expensifiermars.auth0.com',
  AUTH0_CLIENT_ID: 'n6eRxRKz4syfxfa3k0guJrp36eSkEOB0',
  AUTH0_API_ID: 'https://expensifiermars.auth0.com/api/v2/',
}

const devModeOverrides = {
  API_BASE: 'http://192.168.86.181:3000'
}

if (__DEV__) {
  Object.assign(config, devModeOverrides)
}

console.log('config:', config)

export default config;
