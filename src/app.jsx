import { Api } from './api';
// import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

var marked = electronRequire('marked');

var api = new Api('http://127.0.0.1:8000');

var application = null;
var page = null;
var list = null;
var addNoteModal = null;

class Header extends React.Component {
    spin(el) {
        var $el = $(el);
        $el.css('opacity', '1');
        $el.css('transition', 'all 0.3s ease-out');
        $el.css('transform', 'rotate(360deg) scale(1.25)');
        $el.css('transform-origin', '50% 50%');
        // $el.css('opacity', '0');
        window.setTimeout(() => {
            $el.css('transition', 'none');
            $el.css('transform', 'rotate(0deg) scale(1)');
            $el.css('opacity', '1');
        }, 300);
    }
    render() {
        var menu = null;
        var add = null, refresh = null;
        console.log('Render HEADER', this.props.selected);
        if (this.props.page.state.isAuthorized) {
            if (this.props.page.state.selected == 'list') {
                add = (
                    <li><a
                            href="#"
                            onClick={() => addNoteModal.openToCreate()}
                            className="waves-effect waves-default tooltipped"
                        >
                        <i className="material-icons">add</i>
                    </a></li>
                );
                refresh = (
                    <li><a
                            href="#"
                            onClick={(e) => {
                                this.props.page.refresh();
                                // page.setState({
                                //     selected: 'list'
                                // });
                                this.spin($(e.target).closest('a').find('i'));
                                list.refresh()
                            }}
                            className="waves-effect waves-default tooltipped"
                        >
                        <i className="material-icons">refresh</i>
                    </a></li>
                );
            }
            menu = (
                <ul id="nav-mobile" className="right">
                    {add}
                    {refresh}
                    <li><a
                            href="#"
                            onClick={() => this.props.page.switchPage('settings')}
                            className="waves-effect waves-default tooltipped"
                        >
                        <i className="material-icons">settings</i>
                    </a></li>
                    <li><a
                            href="#"
                            onClick={() => this.props.page.logOut()}
                            className="waves-effect waves-default tooltipped"
                        >
                        <i className="material-icons">exit_to_app</i>
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
            <nav className="nav-transparent">
                <div className="nav-wrapper">
                    <div className="container">
                        <a
                            href="#"
                            className="brand-logo"
                            onClick={() => this.props.page.switchPage('list')}
                        >
                            peek
                        </a>
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
            id: null,
            body: '',
            color: this.colors[0]
        };
    }
    selectColor(color) {
        this.setState({color: color});
    }
    openToCreate() {
        this.setState({
            id: null,
            body: '',
            color: this.colors[0]
        }, () => $('#add-note-modal').modal('open'));
    }
    openToEdit(note) {
        this.setState({
            id: note.id,
            body: note.body,
            color: '#' + note.color.toLowerCase()
        }, () => $('#add-note-modal').modal('open'));
        // var self = this;
        // window.setTimeout(() => self.setState({body: 'asd'}), 1000)
    }
    save() {
        var self = this;
        var callback = (response, error) => {
            if (error) {
                Materialize.toast('Failed to save note:<br />' + error, 5000);
            } else {
                $('#add-note-modal').modal('close');
            }
            // list.refresh();
        };
        if (this.state.id) {
            console.log('Update note');
            api.updateNote(
                this.state.id,
                this.state.body,
                this.state.color,
                callback
            );
        } else {
            console.log('Create note');
            api.createNote(
                this.state.body,
                this.state.color,
                callback
            );
        }
    }
    render() {
        return (
            <div id="add-note-modal" className="modal">
                <div className="modal-content">
                    <h4>{this.state.id ? 'Edit note' : 'Add Note'}</h4>
                    <textarea
                        className="materialize-textarea"
                        value={this.state.body}
                        onChange={(e) => this.setState({body: e.target.value})}
                        style={{
                            fontFamily: 'Monospace, DejaVu Sans Mono, Fura Mono, Courier, Courier New'
                        }}
                    ></textarea>
                    <div className="row">
                        {this.colors.map(((color) => {
                            var isCurrent = this.state.color == color;

                            return (
                                <div
                                    key={color}
                                    className="col s2 m1 l1"
                                    style={{padding: '2px'}}
                                >
                                    <div
                                        style={{
                                            paddingTop: '100%',
                                            backgroundColor: color,
                                            border: isCurrent ? '2px solid #000000' : '2px solid #FFFFFF',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => this.selectColor(color)}
                                    ></div>
                                </div>
                            );
                        }).bind(this))}
                    </div>
                </div>
                <div className="modal-footer">
                    <a
                        href="#!"
                        className="modal-action waves-effect waves-green btn-flat"
                        onClick={this.save.bind(this)}
                    >
                        Save
                    </a>
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
        if (a < 0.4) {
            // bright colors - black font
            return '#000000';
        } else {
            // dark colors - white font
            return '#FFFFFF';
        }
    }
    render() {
        var fontSize = 14;

        if (this.props.data.body.length < 32 && this.props.data.body.split('\n').length < 2) {
            fontSize = 24;
        }

        return (
            <div
                className="card-panel note-item"
                style={{
                    backgroundColor: '#' + this.props.data.color,
                    color: this.getContrastingColor(this.props.data.color),
                    cursor: 'pointer',
                    fontSize: fontSize,
                    wordWrap: 'break-word'
                }}
                dangerouslySetInnerHTML={{__html: marked(this.props.data.body)}}
                onClick={() => addNoteModal.openToEdit(this.props.data)}
                >
            </div>
        )
    }
}

class List extends React.Component {
    constructor() {
        super();
        this.state = {
            isLoading: true,
            notes: []
        };
        list = this;
    }
    refresh(showSpinner) {
        page.setState({selected: 'list'});
        var self = this;
        if (showSpinner) {
            this.setState({
                isLoading: true
            });
        }
        api.getNotes((res, e) => {
            if (e) {
                console.log('Error:', e);
                Materialize.toast('Failed to retrieve notes:<br />' + e.message, 5000);
                self.setState({
                    isLoading: false,
                    notes: []
                });
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
                <div style={{paddingTop: '1rem'}}>
                    <div className="row grid-list">
                        {this.state.notes.map((note) => {
                            return (
                                <div
                                    className="col s12 m6 l4 grid-item"
                                    key={note.id.toString()}
                                >
                                    <NoteItem data={note} />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )
        }
    }
    componentDidMount() {
        this.refresh();
        this.initPackery();

        // $grid.packery( 'on', 'dragItemPositioned', function( pckryInstance, draggedItem ) {
        //     setTimeout(function(){
        //         $grid.packery();
        //     }, 10); 
        // });

        // // make all grid-items draggable
        // $grid.find('.grid-item').each( function( i, gridItem ) {
        //     var draggie = new Draggabilly( gridItem );
        //     console.log(draggie);
        //     // bind drag events to Packery
        //     $grid.packery( 'bindDraggabillyEvents', draggie );
        // });
    }

    //     console.log('Grid:', $grid.get(), $grid.find('.grid-item').get());

    // }
    componentDidUpdate(prevProps, prevState) {
        this.initPackery();
    }

    initPackery() {
        var $this = $(ReactDOM.findDOMNode(this));
        var $grid = $this.find('.grid-list');
        $grid.packery('destroy');
        $grid.packery({
            itemSelector: '.grid-item',
            gutter: 0,
            // originLeft: true,
            // originTop: true
            // isHorizontal: true
        });
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
    handleKeyDown(field, event) {
        if (event.keyCode) {

        }
    }
    handleChange(field, event) {
        this.setState({[field]: event.target.value});
    }
    authorize() {
        console.log('auth');
        api.authorize(this.state.username, this.state.password, (result) => {
            page.refresh();
        });
    }
    render() {
        return (
            <div>
                <h1>Log in</h1>
                <form onSubmit={(e) => { e.preventDefault(); this.authorize(); } }>
                    <div className="input-field">
                        <input
                            placeholder="Username"
                            id="username" type="text"
                            className="validate"
                            onKeyDown={this.handleKeyDown.bind(this, 'username')}
                            onChange={this.handleChange.bind(this, 'username')}
                        />
                    </div>

                    <div className="input-field">
                        <input
                            placeholder="Password"
                            id="password"
                            type="password"
                            className="validate"
                            onKeyDown={this.handleKeyDown.bind(this, 'username')}
                            onChange={this.handleChange.bind(this, 'password')}
                        />
                    </div>

                    <input
                        type="submit"
                        className="waves-effect waves-light btn red darken-2"
                        value="Log in"
                    />
                </form>
            </div>
        );
    }
}

class LoadingSpinner extends React.Component {
    render() {
        return (
            <div
                className="center-align"
                style={{
                    paddingTop: '50px'
                }}
            >
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
                isAuthorized: isAuthorized,
                selected: this.state.selected
            });
        });
        api.poll();
    }
    logOut() {
        api.logOut(() => this.setState({
            isLoading: false,
            isAuthorized: false,
            selected: this.state.selected
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
        var className = null;
        var content = null;
        if (state == 'list') {
            className = '';
            content = (
                <div className="container">
                    <List/>
                </div>
            );
        } else if (state == 'settings') {
            className = '';
            content = (
                <div className="container">
                    <h1>Settings (TODO)</h1>
                </div>
            );
        } else if (state == 'login') {
            className = 'white';
            content = (
                <div className="container">
                    <LoginTab />
                </div>
            );
        }
        return (
            <page className={className}>
                <Header page={this} />
                {content}
            </page>
        );
    }
}

class App extends React.Component {
    constructor() {
        super();
        this.state = {
            isOnline: true
        };
        application = this;
    }
    render () {
        var offline = null;
        console.log(this.state.isOnline ? 'You are now ONLINE' : 'You are now OFFLINE')
        if (!this.state.isOnline) {
            offline = (
                <div className="offline">
                    <div className="big">
                        You are offline.
                    </div>
                    <div>
                        We will reconnect automatically once internet connection is regained.
                    </div>
                </div>
            );
        }
        return (
            <div>
                {offline}
                <Page ref={(el) => { page = el }}/>
                <AddNoteModal ref={(el) => { addNoteModal = el }}/>
            </div>
        );
    }
    componentDidMount() {
        api.poll();
    }
};

$(document).ready(() => {
    $('.modal').modal({in_duration: 100, out_duration: 100});

    $(document).on('mouseenter', '.note-item', (e) => {
        $(e.target).closest('.note-item').addClass('z-depth-4');
    }).on('mouseleave', '.note-item', (e) => {
        $(e.target).closest('.note-item').removeClass('z-depth-4');
    });

    api.setPollCallback((event) => {
        console.log('Got event:', event);
        if (event.type == 'created') {
            list.state.notes.unshift(event.instance);
            list.setState({notes: list.state.notes});
        } else if (event.type == 'updated') {
            list.state.notes.forEach((el, i, arr) => {
                if (el.id == event.instance.id) {
                    arr[i] = event.instance;
                }
            });
            list.setState({notes: list.state.notes});
        }
        // console.log(event.type);
        // list.refresh();
    });
    api.setStateChangeCallback((isOnline) => {
        application.setState({isOnline: isOnline});
        if (isOnline) {
            list.refresh();
        }
    });
});

ReactDOM.render(
    <App/>,
    document.getElementById('root')
);
