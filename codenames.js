function newGame() {
  shuffleArray(WORDS);
  return {
    words: WORDS.slice(0,25),
    key: randomKey(),
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

// 0: civilian, 1: red, 2: blue, 3: assassin
function randomKey() {
  var key = [0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,3,(randomInt(2) + 1)];
  shuffleArray(key);
  return key;
}


// 0 to max-1
function randomInt(max) {
  return Math.floor(Math.random() * max);
}

// in-place shuffle.  so, ya know, be careful.
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = randomInt(i + 1);
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}
