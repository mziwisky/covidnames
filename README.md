# COVIDnames

Like [Codenames](https://czechgames.com/en/codenames/), but for quarantined people.

## TODO

 - some instructions on the landing page, including "use some video chat app, this is just the board"
 - or, maybe just go straight to hosting a new game on the landing page, now that there's a guest URL there and sharing that is easier than having guests enter the ID in an input.
   - if so, then guest interface needs a link to host a new game, which should totally reset the state of the app.  starting to feel like Root should have props like "gameID" and "isHost" or something.
 - oooo, maybe someday an option to do P2P video chat in the browser?  probably not.
 - maybe a mode where clue givers don't have to be side-by-side, i.e. "multi-host"
 - turn indicator?
 - "soft" timer, so dad can flip it on the women?
 - bad game ID detection.  just set a timeout on the guest's connection attempts.  when it expires, render something like "we haven't found this game yet. are you sure you got the ID right?"
 - add history capabilities.  i.e. let hosts and guests go "Back" to the landing page, and make host's URL change to the direct-navigation URL that can be shared with guests.
 - use localStorage to make it so hosts that accidentally browse away or refresh can pick up where they left off.
   - store game state and guests list
   - upon reload, connect to all guests and let them know you're the new host now.  do a history.replaceState on the guests so that if they refresh, they stay connected to the right host.
   - uh... how to distinguish between a refresh on a game you're hosting and a navigation to a game you're NOT hosting?  i think we just store the host ID along with the game state.
   - when a host refreshes, the URL changes because the game ID.  that's kind of weird, but i can't think of any other way to do this w/o a server.
 - when a game finishes, let a watcher host a new game and all existing participants become watchers.
 - handle "Error: Lost connection to server". Happens if the server goes down. Current game will continue just fine, because peers retain P2P connection, but they are no longer discoverable after the server comes back online. So make them reregister with the server once it's back.

