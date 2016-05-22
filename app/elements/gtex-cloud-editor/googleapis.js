const CLIENT_ID = '707726290441-2t740vcema93b7jad2acqiku87qe25s6.apps.googleusercontent.com';
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// TODO incremental authorization for specific scopes


const AUTH_PARAMS_POPUP = {
  client_id: CLIENT_ID,
  scope: SCOPES,
  immediate: false
};

const AUTH_PARAMS_IMMEDIATE = {
  client_id: CLIENT_ID,
  scope: SCOPES,
  immediate: true
};


class Auth {
  constructor(auth) {
    this.auth = auth;
  }

  authorize() {
    return new Promise((resolve, reject) => {
      this.auth.authorize(AUTH_PARAMS_POPUP, token => {
        if (token.error) {
          reject(token);
        } else {
          resolve(token);
        }
      });
    });
  }

  authorizeImmediate() {
    return new Promise((resolve, reject) => {
      this.auth.authorize(AUTH_PARAMS_IMMEDIATE, token => {
        if (token.error) {
          reject(token);
        } else {
          resolve(token);
        }
      });
    });
  }

  static authorizeImmediateWith(auth) {
    return new Auth(auth).authorizeImmediate();
  }

}


class Realtime {

  constructor(realtimeApi, auth) {
    this.api = realtimeApi;
    this.auth = auth;
  }

  load(fileId, onLoaded, opt_initializerFn, opt_errorFn, opt_refreshAuthErrorFn) {
    return this.api.load(fileId, onLoaded, opt_initializerFn, e => {
      if (e.type === this.realtime.ErrorType.TOKEN_REFRESH_REQUIRED) {
        console.log('Reauthorizing...');
        this.auth.authorize(token => {
          if (token.error) {
            console.error('Failed to reauthorize.', token);
            if (opt_refreshAuthErrorFn) {
              opt_refreshAuthErrorFn(token);
            }
          } else {
            console.log('Reauthorized.');
            this.api.load(fileId, onLoaded, opt_initializerFn, e => {
              console.error(`Failed to load realtime document for file ${fileId} after attempting reauthorization.`, e);
              if (opt_errorFn) {
                opt_errorFn(e);
              }
            });
          }
        });

      } else {
        opt_errorFn(e);
      }
    });
  }
};


class Drive {

  constructor(drive, gapi) {
    this.drive = drive;
    this.gapi = gapi;
  }

  loadFile(fileId, opt_overrideParams) {
    var params = {fileId: fileId};
    return this.drive.files.get(Object.assign(params, opt_overrideParams)).then(metadataResponse => {
      return this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }).then(downloadResponse => {
        return [metadataResponse, downloadResponse];
      }, response => {
        console.error('Cannot download file.', response);
        throw response;
      });
    }, response => {
      console.error('Cannot get file metadata.', response);
      throw response;
    });
  }

  createTeXFile(name, opt_overrideParams) {
    // TODO: investigate multipart upload to create with content in one request
    var params = {
      name: name,
      mimeType: 'application/x-tex',
      useContentAsIndexableText: true
    };
    return this.drive.files.create(Object.assign(params, opt_overrideParams));
  }

  saveTeXFile(fileId, content, opt_overrideParams) {
    // TODO: investigate PATCH semantics to upload only the changes made
    return this.gapi.client.request({
      path: `/upload/drive/v3/files/${fileId}`,
      method: 'PATCH',
      params: Object.assign({
        uploadType: 'media',
        useContentAsIndexableText: true
      }, opt_overrideParams),
      headers: {
        'Content-Type': 'application/x-tex'
      },
      body: content
    });
  }

  renameFile(fileId, newName, opt_overrideParams) {
    var params = {
      fileId: fileId,
      name: newName
    };
    return this.drive.files.update(Object.assign(params, opt_overrideParams));
  }
};
