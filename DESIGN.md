(nearly) stateless server, all it does is connect "players" (guessers) with "hosts" (clue-givers), so it just has to remember which game ids map to which hosts.

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

## Co-hosting

request:
    {
      msg: "request_co_host"
    }

response, either:
    {
      msg: "reject_co_host"
    }

or:
    {
      msg: "accept_co_host"
      gameState: {
        // full state
      }
    }
