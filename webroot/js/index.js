$("#new-lobby").click( function(e) {

  e.preventDefault()

  $.ajax({
    method: "GET",
    url: 'http://' + window.location.hostname + ':8001/new_lobby',
    dataType: "json",
    success: function(lobby) {
      var lobbyEl = $("<a class=\"lobby\" href=\"game2.html?lobby=" + lobby.id + "&port=" + lobby.port + "\">" + lobby.id + "</a>" );
      $('.lobbies').append(lobbyEl);
    },
  });
});

$("document").ready( function() {

  $.ajax({
    method: "GET",
    url: 'http://' + window.location.hostname + ':8001/lobbies',
    dataType: "json",
    success: function(lobbies) {
      for( lobby in lobbies ) {
        var lobbyEl = $("<a class=\"lobby\" href=\"game2.html?lobby=" + lobby + "&port=" + lobbies[lobby]['port'].toString() + "\">" + lobby + "</a>" );
        $('.lobbies').append(lobbyEl);
      }
    },
  });

});