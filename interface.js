var e = React.createElement;

class Card extends React.Component {
  // { word, type, revealed }

  constructor(props) {
    super(props);
    this.state = { peeking: false };
  }

  togglePeek() {
    this.setState({
      peeking: !this.state.peeking
    });
  }

  render() {
    var className = 'Card';

    switch (this.props.type) {
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

    var onClick = (this.props.revealed ? this.togglePeek.bind(this) : this.props.onClick);
    var content = (this.state.peeking || !this.props.revealed ? this.props.word : null)

    return e('div', { className, onClick }, content);
  }
}

class RowOfCards extends React.Component {
  // { words }
  render() {
    return e('div', { className: 'RowOfCards' },
      this.props.children);
  }
}

class Root extends React.Component {
  constructor(props) {
    super(props);
    var peer = new Peer();
    this.state = {
      appState: "initialized",
      peer: peer
    };

    peer.on('open', (id) => {
      console.log('My peer ID is: ' + id);
      this.setState({
        myId: id
      });
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

    var reds = key.filter(x => x == 1).length
    var blues = key.filter(x => x == 2).length
    var goesFirst = reds > blues ?
      e('div', { className: 'firstPlayer red' }, 'RED goes first') :
      e('div', { className: 'firstPlayer blue' }, 'BLUE goes first');

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

  renderStartGameButton() {
    return e('button', {
      onClick: () => {
        this.setState({
          appState: "hosting",
          gameState: newGame(),
          guests: [],
        });

        this.state.peer.on('connection', (conn) => {
          console.log("new watcher!");
          // for some reason we can't send game state right away
          setTimeout(() => {
            conn.send(getClientState(this.state.gameState));
          }, 1000);
          this.setState({
            guests: this.state.guests.concat(conn)
          });
        });
      }
    }, 'Host New Game');
  }

  renderJoinGameButton() {
    return e('form',
      {
        onSubmit: () => {
          var gameId = this.otherGameIdNode.value;
          var hostConn = this.state.peer.connect(gameId);
          hostConn.on('open', () => {
            console.log("opened connection to host: " + gameId);
          });
          hostConn.on('data', gameState => {
            console.log("got game state!");
            this.setState({
              appState: "watching",
              gameState
            });
          });
          this.setState({
            appState: "joining",
            gameId,
            hostConn,
          });
        }
      },
      e('label', null, 'Join existing game ',
        e('input', { placeholder: 'Game ID', ref: (node) => this.otherGameIdNode = node }),
        e('input', { type: 'submit' })
      )
    );
  }

  render() {
    if (this.state.appState == "initialized")
      return e('div', null, this.renderStartGameButton(), this.renderJoinGameButton());
    if (this.state.appState == "joining")
      return e('div', null, `Joining game "${this.state.gameId}"...`);
    if (this.state.appState == "watching")
      return e('div', null, `Watching game "${this.state.gameId}"`,
        this.renderGuestBoard()
      );
    if (this.state.appState == "hosting")
      return e('div', null,
        e('div', null, `Hosting! Game ID: ${this.state.myId}`),
        this.renderBoard(),
        // because i don't have the timing down yet for when people first join
        // a game, give a button to the host to manually update all guests
        e('button', { onClick: () => this.updateAllGuests(this.state.gameState) }, 'Update All Guests')
      );
  }
}

ReactDOM.render(
  React.createElement(Root, {toWhat: 'World'}, null),
  document.getElementById('root')
);
