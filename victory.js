function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

class Victory extends React.Component {
  constructor(props) {
    super(props);
    this.state = { width: 0 };
    setInterval(
      () =>
        this.setState({
          width: this.state.width < 300 ? 300 : 50
        }),
      1000
    );
  }

  componentDidUpdate(prevProps) {
    // Typical usage (don't forget to compare props):
    if (this.props.userID !== prevProps.userID) {
      this.fetchData(this.props.userID);
    }
    if (this.props.winner !== prevProps.winner && this.props.winner !== null) {
      if (this.props.winner === "assassin") {
        var snd = new Audio("assets/73581__benboncan__sad-trombone.wav");
        snd.play();
      } else {
        var snd = new Audio(
          "assets/456966__funwithsound__success-fanfare-trumpets.mp3"
        );
        snd.play();
      }
    }
  }

  render() {
    if (this.props.winner !== null) {
      let splashClass = "";
      let emoji = "";
      let msg = "";
      switch (this.props.winner) {
        case "red":
          splashClass = "red-wins";
          emoji = "assets/Emoji_u1f389.svg";
          msg = `${capitalizeFirstLetter(this.props.winner)} wins!`;
          break;
        case "blue":
          splashClass = "blue-wins";
          emoji = "assets/Emoji_u1f389.svg";
          msg = `${capitalizeFirstLetter(this.props.winner)} wins!`;
          break;
        case "assassin":
          splashClass = "assassin-wins";
          emoji = "assets/Noto_Emoji_Oreo_2620.svg";
          msg = `You've been assassinated!`;
      }

      return e("div", { className: splashClass, id: "victory-splash" }, [
        e("div", { key: 1, className: "banner" }, msg),
        e("div", { key: 2, className: "emoji", style: { width: this.state.width } }, [
          e("img", { key: 2, src: emoji }, null)
        ])
      ]);
    } else {
      return null;
    }
  }
}
