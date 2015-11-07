if (process.argv.length != 3) {
    console.log("Usage: node GameServer.js [lobby-id]");
    return;
}
var lobbyId = process.argv[2],
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: 8080, path: '/'+lobbyId });

wss.on('connection', function connection(ws) {
  //gs.addUser(ws); -- See comments below
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('something');
});

// TODO: Create GameServer object
// TODO: Add this to GameServer object
function addUser(con) {
  con.on('message', function msgHandler(message) {
    var msg = JSON.parse(message);
    switch (msg.id) {
      // Authentication reply
      case 1:
        if (msg.username && msg.token) {
          // TODO: Verify token against server before approving connection
          // Generate arbitrary number and assign it as an authentication key for this "session"
          // Not very secure, but will work for now; security improvement would be regenerating key upon every received message
          // and echoing it back (aka browser sessions/cookies)
          var authKey = Math.floor(Math.random() * 101);
          userList.push({ username: msg.username, connection: con, auth: authKey }});
          con.send(JSON.stringify({ id: 2, auth: authKey }));
        } else {
          con.terminate();
        }
        break;
      // Junk message received, ignore it (Or terminate connection?)
      default:
        break;
    }
  });

  // Authentication request to client
  con.send(JSON.stringify({ id: 1 }));
}