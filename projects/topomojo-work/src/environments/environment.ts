// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  settings: {
    appname: 'TopoMojo',
    apphost: 'http://localhost:5004',
    mkshost: 'http://localhost:4201',
    enable_upload: true,
    oidc: {
      client_id: 'dev-code',
      authority: 'http://localhost:5000',
      redirect_uri: 'http://localhost:4200/oidc',
      silent_redirect_uri: 'http://localhost:4200/assets/oidc-silent.html',
      response_type: 'code',
      scope: 'openid profile dev-api',
      loadUserInfo: true,
      useLocalStorage: true,
      debug: false,
      autoLogin: false,
      autoLogout: false
    }
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
