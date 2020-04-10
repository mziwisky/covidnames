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
