var params = location.search.split('&port=');
var port = params[1];
var lobbyID = params[0].split('lobby=')[1];
var auth;
var token = 'arbitrary';
//var penis = '<?php echo $_SESSION['username']; ?>';
//console.log(penis);

console.log(port);

var socketURL = url(port, lobbyID);
var websocket = new WebSocket(socketURL); 
    websocket.onopen = function(evt) { onOpen(evt) };
    websocket.onclose = function(evt) { onClose(evt) };
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { onError(evt) };
    



function url(port, id) {
    var l = window.location;
    return ((l.protocol === "https:") ? "wss://" : "ws://") + l.hostname + (((l.port != 80) && (l.port != 443)) ? ":" + port : "") + "/" + id;
}

function onOpen(evt) {
  console.log("websocked opened");
}

function onClose(evt) {
  console.log('goodbye');
}

function onMessage(evt) {
  console.log(evt.data);
  var msg = JSON.parse(evt.data);
  switch(msg['id']) {
    case 1:
      websocket.send(JSON.stringify( { id:1, username: 'landon', token: token } ) );
      break;
    case 2:
      console.log("authentication approved");
      auth = msg['auth'];
      break;
    case 5:
      console.log("it's your turn");
      break;
    case 100:
  }
}

function onError(evt){
  console.log('error');
}