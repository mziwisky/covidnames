# Covidnames

Like [Codenames](https://czechgames.com/en/codenames/), but for quarantined people.

## TODO

 - some instructions on the landing page, including "use some video chat app, this is just the board"
 - oooo, maybe someday an option to do P2P video chat in the browser?  probably not.
 - shorter game IDs (probably impossible w/o my own server)
 - maybe a mode where clue givers don't have to be side-by-side, i.e. "multi-host"
 - remaining cards count
 - turn indicator?
 - "soft" timer, so dad can flip it on the women?
 - bad game ID detection.  just set a timeout on the guest's connection attempts.  when it expires, render something like "we haven't found this game yet. are you sure you got the ID right?"
 - add history capabilities.  i.e. let hosts and guests go "Back" to the landing page, and make host's URL change to the direct-navigation URL that can be shared with guests.
 - use localStorage to make it so hosts that accidentally browse away or refresh can pick up where they left off.
   - store game state and guests list
   - upon reload, connect to all guests and let them know you're the new host now.  do a history.replaceState on the guests so that if they refresh, they stay connected to the right host.
   - uh... how to distinguish between a refresh on a game you're hosting and a navigation to a game you're NOT hosting?  i think we just store the host ID along with the game state.
   - when a host refreshes, the URL changes because the game ID.  that's kind of weird, but i can't think of any other way to do this w/o a server.

