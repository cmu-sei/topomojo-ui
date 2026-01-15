declare var require: any;
export const environment = {
  production: true,
  VERSION: require('../../../../package.json').version,
  settings: {
    appname: 'TopoMojo',
    apphost: '',
    oidc: {}
  }
};
