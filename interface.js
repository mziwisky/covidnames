var e = React.createElement;

class Card extends React.Component {
  // { word, type, revealed }

  render() {
    var style = { cursor: "pointer" };
    if (this.props.type == 0) {
      style['backgroundColor'] = 'antiquewhite';
    }
    if (this.props.type == 1) {
      style['backgroundColor'] = 'palevioletred';
    }
    if (this.props.type == 2) {
      style['backgroundColor'] = 'skyblue';
    }
    if (this.props.type == 3) {
      style['backgroundColor'] = '#333';
      style['color'] = 'white';
    }

    return e('div', { className: 'Card', style, onClick: this.props.onClick }, this.props.word);
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
    updateAllGuests(newState);
  }

  renderBoard() {
    var words = this.state.gameState.words;
    var key = this.state.gameState.key;
    var rows = [
      [0,1,2,3,4].map(i => e(Card, { key: i, word: words[i], type: key[i], onClick: this.revealCard.bind(this, i) })),
      [5,6,7,8,9].map(i => e(Card, { key: i, word: words[i], type: key[i], onClick: this.revealCard.bind(this, i) })),
      [10,11,12,13,14].map(i => e(Card, { key: i, word: words[i], type: key[i], onClick: this.revealCard.bind(this, i) })),
      [15,16,17,18,19].map(i => e(Card, { key: i, word: words[i], type: key[i], onClick: this.revealCard.bind(this, i) })),
      [20,21,22,23,24].map(i => e(Card, { key: i, word: words[i], type: key[i], onClick: this.revealCard.bind(this, i) })),
    ];

    return e('div', { className: 'Board' },
      e(RowOfCards, null, ...rows[0]),
      e(RowOfCards, null, ...rows[1]),
      e(RowOfCards, null, ...rows[2]),
      e(RowOfCards, null, ...rows[3]),
      e(RowOfCards, null, ...rows[4]),
    );
  }

  renderGuestBoard() {
    var words = this.state.gameState.words;
    var key = this.state.gameState.key;
    var rows = [
      [0,1,2,3,4].map(i => e(Card, { key: i, word: words[i], type: key[i], onClick: this.revealCard.bind(this, i) })),
      [5,6,7,8,9].map(i => e(Card, { key: i, word: words[i], type: key[i], onClick: this.revealCard.bind(this, i) })),
      [10,11,12,13,14].map(i => e(Card, { key: i, word: words[i], type: key[i], onClick: this.revealCard.bind(this, i) })),
      [15,16,17,18,19].map(i => e(Card, { key: i, word: words[i], type: key[i], onClick: this.revealCard.bind(this, i) })),
      [20,21,22,23,24].map(i => e(Card, { key: i, word: words[i], type: key[i], onClick: this.revealCard.bind(this, i) })),
    ];

    return e('div', { className: 'Board' },
      e(RowOfCards, null, ...rows[0]),
      e(RowOfCards, null, ...rows[1]),
      e(RowOfCards, null, ...rows[2]),
      e(RowOfCards, null, ...rows[3]),
      e(RowOfCards, null, ...rows[4]),
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
