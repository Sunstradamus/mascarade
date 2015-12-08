$("#new-lobby").click(function(e) {
  e.preventDefault()

  if (this.hasAttribute("disabled")) {
    return false;
  } else {
    $.ajax({
      method: "GET",
      url: 'http://' + window.location.hostname + ':8001/new_lobby',
      dataType: "json",
      success: function(lobby) {
        var status = (lobby.state > 0) ? "Started" : "Waiting for players";
        var lobbyEl = $("<a href=\"game2.php?lobby=" + lobby.id + "&port=" + lobby.port + "\"><div class=\"lobby\" >" + "Lobby ID: " + lobby.id + "<br/>Status: " + status + (lobby.host ? "<br/>Host: " + lobby.host : "") + "</div></a>" );
        $('.lobbies').append(lobbyEl);
      },
    });
  }
});

$("document").ready(function() {

  function getLobbies() {
    $(".lobbies").html("");
    $("#alert-disconnected").html("");
    $.ajax({
      method: "GET",
      url: 'http://' + window.location.hostname + ':8001/lobbies',
      dataType: "json",
      success: function(lobbies) {
        for( lobby in lobbies ) {
          var status = (lobbies[lobby].state > 0) ? "Started" : "Waiting for players";
          var lobbyEl = $("<a href=\"" + (lobbies[lobby].state > 0 ? "#" : "game2.php?lobby=" + lobby + "&port=" + lobbies[lobby].port) + "\"><div class=\"lobby\" >" + "Lobby ID: " + lobby + "<br/>Status: " + status + (lobbies[lobby].host ? "<br/>Host: " + lobbies[lobby].host : "") + "</div></a>" );
          $('.lobbies').append(lobbyEl);
        }
      },
      error: function() {
        if (document.getElementById("new-lobby")) {
          // TODO: Do something here like adjust the refresh rate
        } else {
          document.getElementById("new-lobby").setAttribute("disabled", "true");
          var alert = document.createElement('div');
          alert.id = 'alert-disconnected';
          alert.textContent = 'Connection to Game Coordinator Lost; Searching for Game Coordinator...';
          document.body.appendChild(alert);
        }
      },
    });
  }

  getLobbies();
  setInterval(getLobbies, 10000);

});