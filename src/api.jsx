const storage = electronRequire('electron-json-storage');

export class Api {
    constructor(host) {
        this.host = host.replace(/\/$/, '');
        this.pollTimeout = null;
        this.pollCallback = null;
    }

    request(method, url, data, callback) {
        storage.get('authToken', (error, tokenData) => {
            var authToken = tokenData.value;

            var headers = {
                'Content-Type': 'application/json'
            };
            if (authToken) {
                headers['Authorization'] = 'Token ' + authToken;
            }

            var options = {
                method: method,
                headers: headers,
            };
            if (method != 'GET' && method != 'OPTIONS') {
                var body = JSON.stringify(data);
                options.body = body;
                console.log(method, url, body);
            } else {
                console.log(method, url);
            }

            fetch(this.host + url, options).then(
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
        });
    }

    getNotes(callback) {
        this.request('GET', '/api/notes/', {}, callback)
    }

    getAuthorized(callback) {
        storage.get('authToken', (error, data) => {
            console.log(data);
            callback(!!data.value);
        });
    }

    authorize(username, password, callback) {
        this.request('POST', '/api/auth/', {
            'username': username,
            'password': password
        }, (response, error) => {
            console.log('Auth', response, error);
            if (error) {
                console.log('Auth failed');
                callback(false);
            } else {
                console.log('Auth successful, saving authToken');
                storage.set('authToken', {value: response.token}, () => callback(true));
            }
        });
    }

    logOut(callback) {
        storage.remove('authToken', () => callback());
    }

    createNote(body, color, callback) {
        this.request('POST', '/api/notes/', {
            'body': body,
            'color': color.replace(/^#/, '')
        }, (response, error) => {
            if (error) {
                console.log('Error creating note:', error);
            }
            callback(response, error);
        });
    }

    updateNote(id, body, color, callback) {
        this.request('PATCH', '/api/notes/' + id + '/', {
            'body': body,
            'color': color.replace(/^#/, '')
        }, (response, error) => {
            if (error) {
                console.log('Error creating note:', error);
            }
            callback(response, error);
        });
    }

    setPollCallback(callback) {
        this.pollCallback = callback;
    }

    setStateChangeCallback(callback) {
        this.stateChangeCallback = callback;
    }

    poll(hasFailed) {
        var self = this;
        if (this.pollTimeout !== null) {
            window.clearTimeout();
        }
        this.getAuthorized((isAuthorized) => {
            if (isAuthorized) {
                console.log('Polling...');

                self.request('GET', '/api/notes/poll/', {}, (response, error) => {
                    if (error) {
                        console.log('Polling error. Setting timeout...');
                        this.pollTimeout = window.setTimeout(() => {
                            self.poll(true);
                        }, 3000);
                        if (!hasFailed) {
                            // This error just happened
                            self.stateChangeCallback(false);
                        }
                    } else {
                        if (this.pollCallback) {
                            response.events.forEach(self.pollCallback);
                        }
                        if (hasFailed) {
                            // This error just recovered
                            self.stateChangeCallback(true);
                        }
                        window.setTimeout(() => self.poll(), 0);
                    }
                });
            } else {
                console.log('Not authorized, not polling.');
            }
        });
    }
}
