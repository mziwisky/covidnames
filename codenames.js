function sendToClients(clientState) {
  guests.forEach(function(conn) { conn.send(clientState) });
}

// click a card, this happens:
// var index = 12; // for example
// state = reveal(state, index);
// sendToClients(getClientState(state));

function newGame() {
  // TODO: pick random "rotation" of the key
  shuffleArray(WORDS);
  return {
    words: WORDS.slice(0,25),
    key: KEYS[getRandomInt(KEYS.length)],
    revealed: Array(25).fill(false)
  };
}

function reveal(state, index) {
  var revealed = state.revealed.slice();
  revealed[index] = true;

  return {
    words: state.words,
    key: state.key,
    revealed: revealed
  };
}

function getClientState(state) {
  var key = state.key.map(function(value, i) {
    if (state.revealed[i]) return value;
    return null;
  });

  return {
    words: state.words,
    key: key
  };
}


// 0 to max-1
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// in-place shuffle.  so, ya know, be careful.
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = getRandomInt(i + 1);
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}
