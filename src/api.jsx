const storage = electronRequire('electron-json-storage');

export class Api {
    constructor(host) {
        this.host = host.replace(/\/$/, '');
    }

    _request(promise, callback) {
        return promise.then(
            (response) => {
                if (response.status >= 400) {
                    throw response;
                }
                return response;
            }
        ).then(
            (response) => response.json()
        ).then(
            (response) => callback(response, null)
        ).catch(
            (error) => callback(null, error)
        );
    }

    getNotes(callback) {
        storage.get('authToken', (error, data) => {
            this._request(fetch(this.host + '/api/notes/', {
                headers: {
                    // TODO: Implement auth
                    'Authorization': 'Token ' + data.value
                }
            }), callback)
        });
    }

    getAuthorized(callback) {
        storage.get('authToken', (error, data) => {
            if (data.value) {
                this._request(fetch(this.host + '/api/notes/', {
                    headers: {
                        'Authorization': 'Token ' + data.value
                    }
                }), (response, error) => {
                    console.log('Auth request result:', response, error);
                    callback(!!response);
                });
            } else {
                callback(false);
            }
        });
    }

    authorize(username, password, callback) {
        this._request(fetch(this.host + '/api/auth/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'username': username,
                'password': password
            })
        }), (response, error) => {
            console.log(response, error);
            if (error) {
                callback(false);
            } else {
                storage.set('authToken', {value: response.token}, () => callback(true));
            }
        });
    }

    logOut(callback) {
        storage.remove('authToken', () => callback());
    }

    createNote(body, color, callback) {
        storage.get('authToken', (error, data) => {
            console.log(body, color);
            this._request(fetch(this.host + '/api/notes/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // TODO: Implement auth
                    'Authorization': 'Token ' + data.value
                },
                body: JSON.stringify({
                    'body': body,
                    'color': color.replace(/^#/, '')
                })
            }), (response, error) => {
                if (error) {
                    console.log('Error creating note:', error);
                } else {
                    callback();
                }
            });
        });
    }

    updateNote(id, body, color, callback) {
        callback();
    }
}
