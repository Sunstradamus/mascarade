if (process.argv.length != 3) {
    console.log("Usage: node GameServer.js [lobby-id]");
    return;
}
var lobbyId = process.argv[2],
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 8080, path: '/'+lobbyId });
// TODO: Refactor state enum into its own file
var GameServerState = Object.freeze({
  WAITING_FOR_USERS: 0,
  STARTED_FORCE_SWAP: 1,
});
// TODO: Refactor GS into its own file
var GameServer = function() {

  var self = this;

  self.addUser = function(con) {
    con.on('message', function msgHandler(message) {
      // Check if data is JSON
      var msg;
      try {
        // Prevent DoS by halting the event loop through a large JSON parse
        if (message.length > 500) {
          throw "Bad data";
        }
        msg = JSON.parse(message);
      } catch (e) {
        con.terminate();
        return;
      }
      switch (msg.id) {
        // Authentication reply
        case 1:
          // Check if packet has valid properties for the declared ID
          if (msg.username && msg.token) {
            // TODO: Verify token against server before approving connection
            // Generate arbitrary number and assign it as an authentication key for this "session"
            // Not very secure, but will work for now; security improvement would be regenerating key upon every received message
            // and echoing it back (aka browser sessions/cookies)
            var authKey = Math.floor(Math.random() * 101);
            if (self.lobbyHost === '') {
              self.lobbyHost = msg.username;
            }
            self.userList[msg.username] = { connection: con, auth: authKey };
            con.send(JSON.stringify({ id: 2, auth: authKey }));
          } else {
            con.terminate();
          }
          break;
        // Host clicked on start game
        case 3:
          if (msg.username && msg.auth) {
            // Check if user is even authenticated for our server
            if (!self.userList.hasOwnProperty(msg.username)) {
              con.terminate();
              break;
            }
            if (self.userList[msg.username].auth === msg.auth && con === self.userList[msg.username].connection) {
              self.startGame();
            } else {
              if (self.userList[msg.username].auth === msg.auth) {
                // Bogus connection, not the original connection
                // NOTE: I actually don't know what happens when the browser disconnects, does it attempt to reconnect on the same socket ID?
                con.terminate();
              } else {
                // Invalid auth key, someone may have tried to guess/hijack it so regen key and send back to original client
                var authKey = Math.floor(Math.random() * 101);
                self.userList[msg.username].auth = authKey;
                self.userList[msg.username].connection.send(JSON.stringify({ id: 100, auth: authKey }));
              }
            }
          } else {
            con.terminate();
          }
          break;
        // User clicked leave lobby
        case 4:
          if (msg.username && msg.auth) {
            if (!self.userList.hasOwnProperty(msg.username)) {
              con.terminate();
              break;
            }
            if (self.userList[msg.username].auth === msg.auth && con === self.userList[msg.username].connection) {
              delete self.userList[msg.username];
              con.terminate();
              if (self.lobbyHost === msg.username) {
                var usernames = Object.keys(self.userList);
                var userCount = usernames.length;
                if (userCount > 0) {
                  self.lobbyHost = usernames[0];
                } else {
                  // If everyone leaves this lobby, do we just kill the server?
                  self.lobbyHost = '';
                }
              }
            } else {
              if (self.userList[msg.username].auth === msg.auth) {
                // Bogus connection, not the original connection
                // NOTE: I actually don't know what happens when the browser disconnects, does it attempt to reconnect on the same socket ID?
                con.terminate();
              } else {
                // Invalid auth key, someone may have tried to guess/hijack it so regen key and send back to original client
                var authKey = Math.floor(Math.random() * 101);
                self.userList[msg.username].auth = authKey;
                self.userList[msg.username].connection.send(JSON.stringify({ id: 100, auth: authKey }));
              }
            }
          } else {
            con.terminate();
          }
          break;
        // Using 5 to check connection vars, remove once I figure out how websockets work when clients disconnect
        case 5:
          if (con === self.userList[msg.username].connection) {
            con.send("TRUE");
          } else {
            con.send("FALSE");
          }
          break;
        // Junk message received, ignore it (Or terminate connection?)
        default:
          break;
      }
    });

    // Authentication request to client
    con.send(JSON.stringify({ id: 1 }));
  };

  self.initialize = function() {
    self.gameLoop;
    self.lobbyHost = '';
    self.state = GameServerState.WAITING_FOR_USERS;
    self.userList = {};
  };

  self.processGameState = function() {

  };

  self.startGame = function() {
    var userCount = Object.keys(self.userList).length;
    if (userCount < 3) {
      self.userList[self.lobbyHost].connection.send(JSON.stringify({ id: 101 }));
    } else {
      self.state = GameServerState.STARTED_FORCE_SWAP;
      //self.gameLoop = setTimeout(self.processGameState, 30000);
    }
  };

};

var gs = new GameServer();
gs.initialize();
wss.on('connection', function connection(ws) {
  gs.addUser(ws);
});