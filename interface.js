var e = React.createElement;

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
      hostConn.send({ msg: 'gimme_game_state' });
    });

    hostConn.on('data', this.handleHostData)

    this.setState({
      appState: "joining",
      gameId,
      hostConn,
    });
  }

  handleHostData = (data) => {
    console.log('Host data:', data)
    switch (data.msg) {
      case 'guest_game_state':
        this.updateStateFromHost(data.gameState)
        break
      case 'co_host_game_state':
        this.setState({ gameState: data.gameState })
        break
      case 'accept_co_host':
        this.setState({
          appState: 'coHosting',
          gameState: data.gameState
        })
        break;
    }
  }

  updateStateFromHost = (gameState) => {
    this.setState({
      appState: 'watching',
      gameState
    });
  }

  askToCoHost = () => {
    this.state.hostConn.send({ msg: 'request_co_host' })
  }

  updateAllGuests(gameState) {
    var clientState = getClientState(gameState);
    this.state.guests.forEach((conn) => {
      switch (conn.peer) {
        case this.state.coHost.peer:
          conn.send({
            msg: 'co_host_game_state',
            gameState
          })
          break
        default:
          conn.send({
            msg: 'guest_game_state',
            gameState: clientState
          })
          break
      }
    })
  }

  revealCard(index) {
    switch (this.state.appState) {
      case 'hosting': this.actuallyRevealCard(index)
        break
      case 'coHosting': this.askToRevealCard(index)
        break
    }
  }

  actuallyRevealCard(index) {
    console.log("revealing " + index);
    var newState = reveal(this.state.gameState, index);
    this.setState({
      gameState: newState
    });
    this.updateAllGuests(newState);
  }

  askToRevealCard(index) {
    this.state.hostConn.send({ msg: 'reveal_card', index })
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

    conn.on('data', (data) => this.handleWatcherData(conn, data))
  }

  handleWatcherData = (conn, data) => {
    console.log('Watcher data:', data)
    switch (data.msg) {
      case 'gimme_game_state':
        conn.send({
          msg: 'guest_game_state',
          gameState: getClientState(this.state.gameState)
        })
        break
      case 'request_co_host':
        if (this.state.coHost) {
          console.log('co-host request rejected because already have a co-host')
          conn.send({msg: 'reject_co_host'})
        } else if (this.state.coHostRequester) {
          console.log('co-host request rejected because already have a co-host requester')
          conn.send({msg: 'reject_co_host'})
        } else {
          this.setState({ coHostRequester: conn })
        }
        break
      case 'reveal_card':
        if (this.state.coHost.peer == conn.peer) {
          this.revealCard(data.index)
        } else {
          console.log('non-co-host tried to reveal a card')
        }
        break
    }
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

  acceptCoHost = () => {
    this.state.coHostRequester.send({
      msg: 'accept_co_host',
      gameState: this.state.gameState
    })
    this.setState({
      coHost: this.state.coHostRequester,
      coHostRequester: null
    });
  }

  rejectCoHost = () => {
    this.state.coHostRequester.send({ msg: 'reject_co_host' })
    this.setState({ coHostRequester: null });
  }

  renderNotifications = () => {
    var children = this.state.coHostRequester ?  [
      e('span', null, 'Co-host requested, i.e. someone wants to see the colors.'),
      e('button', { onClick: this.acceptCoHost }, 'Accept'),
      e('button', { onClick: this.rejectCoHost }, 'Reject')
    ] : []

    return e('div', { className: 'Notifications' }, ...children)
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
          e('button', { onClick: this.askToCoHost }, 'Ask To Co-Host'),
          this.renderGuestBoard(),
          this.renderCardsLeft()
        );
      case "hosting":
        var heading = this.state.myId ? `Hosting! Game ID: ${displayId(this.state.myId)}` : "Hosting! Loading Game ID...";
        var url = window.location.origin + window.location.pathname + '?' + displayId(this.state.myId);
        return e('div', null,
          this.renderNotifications(),
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
      case "coHosting":
        var heading = `Co-Hosting! Game ID: ${displayId(this.state.gameId)}`
        var url = window.location.origin + window.location.pathname + '?' + displayId(this.state.gameId);
        return e('div', null,
          this.renderNotifications(),
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
            e('p', null, "WARNING: don't refresh the page. If you do, you'll lose your co-host status and won't be able to regain it. (This is a bug, it'll maybe be fixed sometime.)"),
          ),
        )
    }
  }
}

var initialGameId = window.location.search.slice(1);

ReactDOM.render(
  React.createElement(Root, { initialGameId }, null),
  document.getElementById('root')
);
