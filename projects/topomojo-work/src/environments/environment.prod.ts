import pkg from '../../../../package.json';

export const environment = {
  production: true,
  VERSION: pkg.version,
  settings: {
    appname: 'TopoMojo',
    apphost: '',
    oidc: {}
  }
};
