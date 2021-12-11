const eggIndices = [2,7,12,17,22];

function applyEgg(state) {
  if (state.words.includes("JACK")) {
    state.words = WORDS.slice(25,50);
  }
  state.words[eggIndices[0]] = 'JACK'
  state.words[eggIndices[1]] = 'WILL'
  state.words[eggIndices[2]] = 'SOON'
  state.words[eggIndices[3]] = 'ENCOUNTER'
  state.words[eggIndices[4]] = 'COMPETITION'
  return state
}

function newGame() {
  shuffleArray(WORDS)
  var key = randomKey()
  var redLeft = key.filter(x => x == 1).length
  var blueLeft = key.filter(x => x == 2).length
  return applyEgg({
    words: WORDS.slice(0,25),
    key,
    revealed: Array(25).fill(false),
    firstTeam: redLeft > blueLeft ? 'RED' : 'BLUE',
    redLeft,
    blueLeft
  })
}

function reveal(state, index) {
  var revealed = state.revealed.slice();
  revealed[index] = true;

  var { redLeft, blueLeft } = state
  if (state.key[index] == 1) redLeft--;
  if (state.key[index] == 2) blueLeft--;

  return {
    ...state,
    revealed,
    redLeft,
    blueLeft
  }
}

function getClientState(state) {
  var key = state.key.map(function(value, i) {
    if (state.revealed[i]) return value;
    return null;
  });

  return {
    ...state,
    key
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

const ID_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const PEER_PREFIX = 'COVIDnames-'

function randomChar() {
  return ID_POOL.charAt(randomInt(ID_POOL.length))
}

function randomPeerId() {
  var id = randomChar() + randomChar() + randomChar() + randomChar() + randomChar()
  return fullPeerId(id)
}

function displayId(actualPeerId) {
  if (!actualPeerId) return actualPeerId;
  return actualPeerId.replace(PEER_PREFIX, '')
}

function fullPeerId(displayId) {
  if (!displayId) return displayId;
  return `${PEER_PREFIX}${displayId}`
}
