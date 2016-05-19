const CLIENT_ID = '707726290441-2t740vcema93b7jad2acqiku87qe25s6.apps.googleusercontent.com';
const SCOPES = ['https://www.googleapis.com/auth/drive.install',
                'https://www.googleapis.com/auth/drive.file'];

const AUTH_PARAMS = {
  client_id: CLIENT_ID,
  scope: SCOPES,
  immediate: true
};


class Auth {
  constructor(auth) {
    this.auth = auth;
  }


  authorize(callback) {
    this.auth.authorize(AUTH_PARAMS, callback);
  }

  static _authorize(auth, callback) {
    auth.authorize(AUTH_PARAMS, callback);
  }

}

export class Realtime {

  constructor(realtimeApi, auth) {
    this.api = realtimeApi;
    this.auth = auth;
  }

  load(fileId, onLoaded, opt_initializerFn, opt_errorFn) {
    return this.api.load(fileId, onLoaded, opt_initializerFn, e => {

      if (e.type === this.realtime.ErrorType.TOKEN_REFRESH_REQUIRED) {
        console.log('Reauthorizing...');
        this.auth.authorize(_ => {
          console.log('Reauthorized.');
          this.api.load(fileId, onLoaded, opt_initializerFn, e => {
            console.error(`Failed to load realtime document for file ${fileId} after attempting reauthorization.`, e);
            opt_errorFn(e);
          });
        });

      } else {
        opt_errorFn(e);
      }
    });
  }
};


// function sendGApiXhr(xhr, opt_data) {
//   xhr.setHeader('Authorization', 'Bearer
//   return sendXhr(xhr, opt_data).then(xhr => xhr.response, xhr => {
//     throw xhr.response;
//   });
// }

// function sendXhr(xhr, opt_data) {
//   return new Promise((resolve, reject) => {
//     xhr.send(opt_data);
//     xhr.onreadystatechange = () => {
//       if (xhr.readyState === XMLHttpRequest.DONE) {
//         if (xhr.status === 200) {
//           resolve(xhr);
//         } else {
//           reject(xhr);
//         }
//       };
//     };
//   });
// }


export class Drive {

  constructor(drive, gapi) {
    this.drive = drive;
    this.gapi = gapi;
  }

  createTeXFile(name, opt_overrideParams) {
    var opts = {
      name: name,
      mimeType: 'application/x-tex',
      useContentAsIndexableText: true
    };
    return this.drive.files.create(Object.assign(opts, opt_overrideParams));
  }

  uploadTeXFile(fileId, content, opt_overrideParams) {
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

    // var xhr = new XMLHttpRequest();
    // xhr.open('PATCH', `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&useContentAsIndexableText=true`);
    // xhr.responseType = 'json';
    // return sendGApiXhr(xhr, content);
    // TODO
  }
};


export default function newDriveAndRealtimePromise(
    driveApiLoader, realtimeApiLoader) {
  var realtimePromise;
  if (realtimeApiLoader.libraryLoaded) {
    realtimePromise = Promise.resolve(realtimeApiLoader.api);
  } else {
    realtimePromise = new Promise((resolve, reject) => {
      realtimeApiLoader.addEventListener('api-load', e => resolve(e.target.api));
      realtimeApiLoader.addEventListener('library-error-message-changed',
                                         e => reject(e.detail.value));
    });
  }

  var drivePromise = new Promise((resolve, reject) => {
    driveApiLoader.addEventListener('google-api-load', e => {
      var auth = e.target.auth;
      Auth._authorize(auth, _ => resolve(e.target.api));
    });

    driveApiLoader.addEventListener('google-api-load-error',
                                    e => reject(e.detail.value));
  });

  return Promise.all([drivePromise, realtimePromise])
    .then(([driveApi, realtimeApi]) => {
      var realtime = new Realtime(realtimeApi, new Auth(window.gapi.auth));
      var drive = new Drive(driveApi, window.gapi);
      return [drive, realtime];
    });
}
