import { Api } from './api';

var api = new Api('http://127.0.0.1:8000');

var page = null;
var list = null;
var addNoteModal = null;

class Header extends React.Component {
    render() {
        var menu = null;
        if (this.props.page.state.isAuthorized) {
            menu = (
                <ul id="nav-mobile" className="right hide-on-med-and-down">
                    <li><a href="#" onClick={() => $('#add-note-modal').modal('open')}>
                        <i className="material-icons left">add</i>
                        Add
                    </a></li>
                    <li><a href="#" onClick={() => this.props.page.switchPage('settings')}>
                        <i className="material-icons left">settings</i>
                        Settings
                    </a></li>
                    <li><a href="#" onClick={() => this.props.page.logOut()}>
                        <i className="material-icons left">exit_to_app</i>
                        Log out
                    </a></li>
                </ul>
            );
        } else {
            menu = (
                <ul id="nav-mobile" className="right hide-on-med-and-down">
                </ul>
            );
        }
        return (
            <nav>
                <div className="nav-wrapper red darken-2">
                    <div className="container">
                        <a href="#" className="brand-logo" onClick={() => this.props.page.switchPage('list')}>Peek</a>
                        {menu}
                    </div>
                </div>
            </nav>
        );
    }
}

class AddNoteModal extends React.Component {
    constructor(props) {
        super(props);
        this.colors = [
            '#d32f2f',
            '#c2185b',
            '#7b1fa2',
            '#512da8',
            '#1976d2',
            '#00796b',
            '#388e3c',
            '#afb42b',
            '#fbc02d',
            '#f57c00',
            '#e64a19',
            '#616161',
        ];
        this.state = {
            body: this.props.body || '',
            color: this.props.color || this.colors[0]
        };
    }
    selectColor(color) {
        this.setState({color: color});
    }
    save() {
        var self = this;
        var callback = () => {
            $('#add-note-modal').modal('close');
            list.refresh();
        };
        if (this.props.id) {
            console.log('Update note');
            api.updateNote(this.props.id, this.state.body, this.state.color, callback);
        } else {
            console.log('Create note');
            api.createNote(this.state.body, this.state.color, callback);
        }
    }
    render() {
        return (
            <div id="add-note-modal" className="modal">
                <div className="modal-content">
                    <h4>Add Note</h4>
                    <textarea className="materialize-textarea" defaultValue="" onChange={(e) => this.setState({body: e.target.value})}></textarea>
                    <div className="row">
                        {this.colors.map(((color) => {
                            var isCurrent = this.state.color == color;

                            return (
                                <div key={color} className="col s2 m1 l1" style={{padding: '2px'}}>
                                    <div style={{paddingTop: '100%', backgroundColor: color, border: isCurrent ? '2px solid #000000' : '2px solid #FFFFFF', cursor: 'pointer'}} onClick={() => this.selectColor(color)}></div>
                                </div>
                            );
                        }).bind(this))}
                    </div>
                </div>
                <div className="modal-footer">
                    <a href="#!" className="modal-action modal-close waves-effect waves-green btn-flat" onClick={this.save.bind(this)}>Save</a>
                </div>
            </div>
        );
    }
}

class NoteItem extends React.Component {
    getContrastingColor(str) {
        var r = parseInt(str.substr(0, 2), 16);
        var g = parseInt(str.substr(2, 2), 16);
        var b = parseInt(str.substr(4, 2), 16);
        var a = 1 - ( 0.299 * r + 0.587 * r + 0.114 * b) / 255;
        if (a < 0.5) {
            // bright colors - black font
            return '#000000';
        } else {
            // dark colors - white font
            return '#FFFFFF';
        }
    }
    render() {
        return (
            <div className="card-panel" style={{
                    backgroundColor: '#' + this.props.data.color,
                    color: this.getContrastingColor(this.props.data.color)
                }}>
                Abc
                {this.props.data.content}
            </div>
        )
    }
}

class List extends React.Component {
    constructor() {
        super();
        this.state = {
            isLoading: true,
            notes: null
        };
        this.refresh();
        list = this;
    }
    refresh() {
        var self = this;
        api.getNotes((res, e) => {
            if (e) {
                console.log('Error:', e);
            } else {
                self.setState({
                    isLoading: false,
                    notes: res
                });
            }
        });
    }
    render() {
        if (this.state.isLoading) {
            return <LoadingSpinner />;
        } else {
            return (
                <div>
                    <h1>List</h1>
                    <div className="row">
                        {this.state.notes.map((note) => {
                            return (
                                <div className="col s12 m4" key={note.id.toString()}>
                                    <NoteItem data={note} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )
        }
    }
}

class LoginTab extends React.Component {
    constructor() {
        super();
        this.state = {
            username: '',
            password: ''
        };
    }
    handleChange(field, event) {
        this.setState({[field]: event.target.value});
    }
    authorize() {
        api.authorize(this.state.username, this.state.password, (result) => {
            this.props.page.refresh();
        });
    }
    render() {
        return (
            <div>
                <h1>Log in</h1>
                <form>
                    <div className="input-field">
                        <input placeholder="Username" id="username" type="text" className="validate" onChange={this.handleChange.bind(this, 'username')} />
                    </div>

                    <div className="input-field">
                        <input placeholder="Password" id="password" type="password" className="validate" onChange={this.handleChange.bind(this, 'password')} />
                    </div>

                    <a className="waves-effect waves-light btn red darken-2" onClick={this.authorize.bind(this)}>Log in</a>
                </form>
            </div>
        );
    }
}

class LoadingSpinner extends React.Component {
    render() {
        return (
            <div className="center-align" style={{paddingTop: '50px'}}>
                <div className="preloader-wrapper active">
                    <div className="spinner-layer spinner-red-only">
                        <div className="circle-clipper left">
                            <div className="circle"></div>
                        </div>
                        <div className="gap-patch">
                            <div className="circle"></div>
                        </div>
                        <div className="circle-clipper right">
                            <div className="circle"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

class Page extends React.Component {
    constructor() {
        super();
        this.state = {
            isLoading: true,
            isAuthorized: false,
            selected: 'list'
        };
        this.refresh();
    }
    switchPage(page) {
        this.setState({
            selected: page
        });
    }
    refresh() {
        var self = this;
        api.getAuthorized((isAuthorized) => {
            self.setState({
                isLoading: false,
                isAuthorized: isAuthorized
            });
        });
    }
    logOut() {
        api.logOut(() => this.setState({
            isLoading: false,
            isAuthorized: false
        }));
    }
    render() {
        var state = this.state.selected;
        if (this.state.isLoading) {
            return (
                <page>
                    <Header page={this} />
                    <LoadingSpinner />
                </page>
            )
        }
        if (!this.state.isAuthorized) {
            state = 'login';
        }
        var content = null;
        if (state == 'list') {
            content = (
                <List/>
            );
        } else if (state == 'settings') {
            content = (
                <h1>Settings</h1>
            );
        } else if (state == 'login') {
            content = (
                <LoginTab page={this} />
            );
        }
        return (
            <page>
                <Header page={this} />
                <div className="container">
                    {content}
                </div>
            </page>
        );
    }
}

class App extends React.Component {
    render () {
        return (
            <div>
                <Page ref={(el) => { page = el }}/>
                <AddNoteModal ref={(el) => { addNoteModal = el }}/>
            </div>
        );
    }
};

$(document).ready(function(){
    // the "href" attribute of .modal-trigger must specify the modal ID that wants to be triggered
    $('.modal').modal();
});

ReactDOM.render(
    <App/>,
    document.getElementById('root')
);
