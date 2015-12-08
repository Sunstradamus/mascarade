MASCARADE README
================

What is working
---------------

Original art assets (maybe one more fancy background)

Game can completely run with 4 to 13 users at once

Game coordinator can get you into a lobby and handle displaying multiple lobbies with some information on each

Users can change their password

Chat/log spam prevention

What could be improved
----------------------

Visuals could be better (especially mobile sizes)

Win/loss tracking

Known issues
------------

Replay attacks are possible against GameCoordinator.js since the requests are not timestamped

Premade accounts
----------------

root:password

Mysql credentials
-----------------

root:SekurePassword
webapp:SekretPassWord

Project Notes
-------------

In `webroot/js/game.js` set DEBUG on line 5 to true and you'll get access to a way to start a game by yourself with 12 other fake users. You will also need to set `enableTurnCheck` to false on line 768 of `nodejs/GameServer.js`. Use this to test the cards not available in a 4 player game. Note that perfect client functionality is not guaranteed since your client will be receiving every message 13 times, so for best results just use "CHECK" for all of the fake users and only test card abilities on your own account (the one that can go when it says "It's your turn!" in the log)

