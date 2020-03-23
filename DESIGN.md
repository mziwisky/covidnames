(nearly) stateless server, all it does is connect "players" (guessers) with "hosts" (clue-givers), so it just has to remember which game ids map to which hosts.

POST /game
{
  id: "AYZG",
  words: ["a", "list", "of", "twenty-five", "words"],
  key: ["red", "none", "blue", "assassin", ...]
}

GET /game/:id
{
  whatever: "is needed to WebRTC to the host"
}


## Host API:
`get_state`
{
  words: ["a", "list", "of", "twenty-five", "words"],
  key: [null, null, "blue", null, ...]
}

Host pushes full state whenever it wants


host state looks like:
{
  words: ["a", "list", "of", "twenty-five", "words"],
  key: [0, 0, 1, 2, 1, 1, 0, 3, 2, 1, 2, 2, 0, 0, 0, ...] // 0,1,2,3 for neutral,red,blue,assassin
  revealed: [true, false, true, false, false, false, ...]
}


guest state looks like:
{
  words: ["a", "list", "of", "twenty-five", "words"],
  key: [0, null, 1, null, null, ...] // 0,1,2,3 for neutral,red,blue,assassin, null for unknown
}
