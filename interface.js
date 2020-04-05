var e = React.createElement;

class Card extends React.Component {
  // { word, type, revealed }

  constructor(props) {
    super(props);
    this.state = { peeking: 0 };
  }

  peek = () => {
    this.setState({ peeking: this.state.peeking + 1 });
    setTimeout(() => this.setState({ peeking: this.state.peeking - 1 }), 3000);
  }

  render() {
    var className = 'Card';

    switch (this.props.type) {
      case null: className += ' unknown';
        break;
      case 0: className += ' civilian';
        break;
      case 1: className += ' red';
        break;
      case 2: className += ' blue';
        break;
      case 3: className += ' assassin';
        break;
    }
    if (this.props.revealed)
      className += ' revealed';

    if (this.state.peeking > 0)
      className += ' peeking';

    var onClick = (this.props.revealed ? this.peek : this.props.onClick);

    return e('div', { className, onClick }, this.props.word);
  }
}

class RowOfCards extends React.Component {
  render() {
    return e('div', { className: 'RowOfCards' }, this.props.children);
  }
}

class Root extends React.Component {
  constructor(props) {
    super(props);
    // TODO: some kind of switch to let users go onto this herokuapp in case the main PeerJS server goes down
    // var peer = new Peer(randomPeerId(), {debug: 3, secure: false, port: 80, host: 'covidnames-peer-server.herokuapp.com'});
    var peer = new Peer(randomPeerId(), {debug: 3});
    this.state = { peer: peer }
    if (props.initialGameId) {
      this.state.gameId = props.initialGameId
      this.state.appState = "needToJoin"
    } else {
      this.state.appState = "initializing"
    }

    peer.on('open', this.setMyPeerId)
  }

  setMyPeerId = (id) => {
    if (this.state.myId) console.log("WARNING: my peer ID is already set, this is probably bad");
    console.log('My peer ID is: ' + id)
    var newState = { myId: id }
    if (this.state.appState == "initializing") {
      newState.appState = "initialized"
    }
    this.setState(newState)
    if (this.state.appState == "needToJoin") {
      this.actuallyJoin()
    }
  }

  joinGame = (gameId) => {
    if (this.state.appState == "initialized") {
      this.actuallyJoin(gameId)
    } else if (this.state.appState == "initializing") {
      this.setState({
        gameId,
        appState: "needToJoin"
      });
    } else {
      console.log(`WARNING: tried to join game from appState=${this.state.appState} -- doing nothing`)
    }
  }

  actuallyJoin = (gameId) => {
    gameId = gameId || this.state.gameId
    var hostConn = this.state.peer.connect(fullPeerId(gameId));
    hostConn.on('open', () => {
      console.log("opened connection to host: " + gameId);
      // host can't just send game state immediately upon 'connection',
      // so we let host know we're ready for it by sending a message
      hostConn.send({ request: 'gameState' });
    });

    // NOTE: assumes the only data host sends is game state
    hostConn.on('data', this.updateStateFromHost)

    this.setState({
      appState: "joining",
      gameId,
      hostConn,
    });
  }

  updateStateFromHost = (gameState) => {
    console.log("got game state!");
    this.setState({
      appState: "watching",
      gameState
    });
  }

  updateAllGuests(gameState) {
    var clientState = getClientState(gameState);
    this.state.guests.forEach((conn) => {
      conn.send(clientState)
    })
  }

  revealCard(index) {
    console.log("revealing " + index);
    var newState = reveal(this.state.gameState, index);
    this.setState({
      gameState: newState
    });
    this.updateAllGuests(newState);
  }

  renderBoard() {
    var key = this.state.gameState.key;
    var revealed = this.state.gameState.revealed;

    var cards = this.state.gameState.words.map((word, i) => {
      return e(Card, { key: word, word, type: key[i], revealed: revealed[i], onClick: this.revealCard.bind(this, i) });
    });

    var goesFirst = this.state.gameState.firstTeam == 'RED' ?
      e('div', { className: 'red' }, 'RED goes first') :
      e('div', { className: 'blue' }, 'BLUE goes first');

    return e('div', { className: 'Board' },
      goesFirst,
      e(RowOfCards, null, ...cards.slice(0,5)),
      e(RowOfCards, null, ...cards.slice(5,10)),
      e(RowOfCards, null, ...cards.slice(10,15)),
      e(RowOfCards, null, ...cards.slice(15,20)),
      e(RowOfCards, null, ...cards.slice(20,25)),
    );
  }

  renderGuestBoard() {
    var key = this.state.gameState.key;
    var revealed = key.map(v => v != null);

    var cards = this.state.gameState.words.map((word, i) => {
      return e(Card, { key: word, word, type: key[i], revealed: revealed[i] });
    });

    return e('div', { className: 'Board' },
      e(RowOfCards, null, ...cards.slice(0,5)),
      e(RowOfCards, null, ...cards.slice(5,10)),
      e(RowOfCards, null, ...cards.slice(10,15)),
      e(RowOfCards, null, ...cards.slice(15,20)),
      e(RowOfCards, null, ...cards.slice(20,25)),
    );
  }

  renderCardsLeft() {
    return e('div', { className: 'score' },
      e('span', null, 'Cards remaining:\u00A0'),
      e('span', { className: 'red' }, `${this.state.gameState.redLeft} red`),
      e('span', null, '\u00A0--\u00A0'),
      e('span', { className: 'blue' }, `${this.state.gameState.blueLeft} blue`),
    )
  }

  renderStartGameButton() {
    return e('button', { onClick: this.configureForHosting }, 'Host New Game');
  }

  configureForHosting = () => {
    this.setState({
      appState: 'hosting',
      gameState: newGame(),
      guests: [],
    });

    this.state.peer.on('connection', this.registerWatcher)
  }

  registerWatcher = (conn) => {
    console.log("new watcher: " + conn.peer);
    this.setState({
      guests: this.state.guests.concat(conn)
    });

    // only kind of message clients ever send right now is a "hey i'm
    // ready for the initial game state", so that's all we respond to
    conn.on('data', (data) => {
      conn.send(getClientState(this.state.gameState));
    });
  }

  renderJoinGameButton() {
    return e('form',
      {
        onSubmit: () => {
          var gameId = this.otherGameIdNode.value;
          this.joinGame(gameId);
        }
      },
      e('label', null, 'Join existing game ',
        e('input', { placeholder: 'Game ID', ref: (node) => this.otherGameIdNode = node }),
        e('input', { type: 'submit' })
      )
    );
  }

  render() {
    switch (this.state.appState) {
      case "initializing":
      case "initialized":
        return e('div', null,
          this.renderStartGameButton(),
          this.renderJoinGameButton()
        );
      case "needToJoin":
      case "joining":
        return e('div', null, `Joining game: ${this.state.gameId}...`);
      case "watching":
        return e('div', null, `Watching game: ${this.state.gameId}`,
          this.renderGuestBoard(),
          this.renderCardsLeft()
        );
      case "hosting":
        var heading = this.state.myId ? `Hosting! Game ID: ${displayId(this.state.myId)}` : "Hosting! Loading Game ID...";
        var url = window.location.origin + window.location.pathname + '?' + displayId(this.state.myId);
        return e('div', null,
          e('div', null, heading),
          e('div', null, 'Guest URL: ',
            (this.state.myId ? e('a', { href: url, target: '_blank' }, url) : 'Loading...')
          ),
          this.renderBoard(),
          this.renderCardsLeft(),
          e('div', { className: 'HostInstructions' },
            e('p', null, 'Guests (guessers) can join with the Game ID or Guest URL above.'),
            e('p', null, 'Clicking a card will reveal its color to all guests.'),
            e('p', null, 'Clicking an already-revealed card will peek at the word underneath.'),
            e('p', null, "WARNING: don't refresh the page. If you do, the game will end."),
          ),
        );
    }
  }
}

var initialGameId = window.location.search.slice(1);

ReactDOM.render(
  React.createElement(Root, { initialGameId }, null),
  document.getElementById('root')
);
