console.log(`loading configuration (dev mode=${__DEV__})`);

const config = {
  API_BASE: 'https://meeting-assistant-app.herokuapp.com/',
}

const devModeOverrides = {
  API_BASE: 'http://192.168.86.181:3000',
}

if (__DEV__) {
  Object.assign(config, devModeOverrides)
}

console.log('config:', config)
export default config;
