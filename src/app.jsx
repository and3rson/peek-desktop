import { Api } from './api';
var marked = electronRequire('marked');

var api = new Api('http://127.0.0.1:8000');

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
        if (this.props.page.state.isAuthorized) {
            menu = (
                <ul id="nav-mobile" className="right">
                    <li><a href="#" onClick={() => addNoteModal.openToCreate()}>
                        <span className="hide-on-med-and-down">
                            <i className="material-icons left">add</i>
                            Add
                        </span>
                        <span className="hide-on-large-only">
                            <i className="material-icons">add</i>
                        </span>
                    </a></li>
                    <li><a href="#" onClick={(e) => { this.spin($(e.target).closest('a').find('i')); list.refresh() }}>
                        <span className="hide-on-med-and-down">
                            <i className="material-icons left">refresh</i>
                            Refresh
                        </span>
                        <span className="hide-on-large-only">
                            <i className="material-icons">refresh</i>
                        </span>
                    </a></li>
                    <li><a href="#" onClick={() => this.props.page.switchPage('settings')}>
                        <span className="hide-on-med-and-down">
                            <i className="material-icons left">settings</i>
                            Settings
                        </span>
                        <span className="hide-on-large-only">
                            <i className="material-icons">settings</i>
                        </span>
                    </a></li>
                    <li><a href="#" onClick={() => this.props.page.logOut()}>
                        <span className="hide-on-med-and-down">
                            <i className="material-icons left">exit_to_app</i>
                            Log out
                        </span>
                        <span className="hide-on-large-only">
                            <i className="material-icons">exit_to_app</i>
                        </span>
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
        var callback = () => {
            // $('#add-note-modal').modal('close');
            // list.refresh();
        };
        if (this.state.id) {
            console.log('Update note');
            api.updateNote(this.state.id, this.state.body, this.state.color, callback);
        } else {
            console.log('Create note');
            api.createNote(this.state.body, this.state.color, callback);
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
                        style={{fontFamily: 'Monospace, DejaVu Sans Mono, Fura Mono, Courier, Courier New'}}
                    ></textarea>
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
            notes: null
        };
        this.refresh();
        list = this;
    }
    refresh(showSpinner) {
        var self = this;
        if (showSpinner) {
            this.setState({
                isLoading: true
            });
        }
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
                <div style={{paddingTop: '1rem'}}>
                    <div className="row grid-list">
                        {this.state.notes.map((note) => {
                            return (
                                <div className="col s12 m6 l4 grid-item" key={note.id.toString()}>
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
        console.log('mount');
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
        this.componentDidMount();
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
        api.poll();
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
                <h1>Settings (TODO)</h1>
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
    api.poll();
});

ReactDOM.render(
    <App/>,
    document.getElementById('root')
);
