if (process.argv.length != 3) {
  console.log("Usage: node GameCoordinator.js [master/cluster/combined]");
  return;
}
var mode = process.argv[2];
switch (mode) {
  // Run as master GC server for lobby listings
  case 'master':
    break;
  // Run as cluster GC server for starting local GS lobbies
  case 'cluster':
    break;
  // Run as both a master and cluster GC server
  case 'combined':
    var exec = require('exec'),
        http = require('http'),
        parser = require('url').parse;

    var lobbies = {};
    http.createServer(function(req, res) {
      var url = parser(req.url, true);
      res.setHeader("Content-Type", "application/json; charset=UTF-8");
      switch(req.method) {
        case 'GET':
          switch(url.pathname) {
            case '/user_token':
              res.end();
              break;
            case '/new_lobby':
              var id = "";
              var allowed = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
              for (var i = 0; i < 5; i++) {
                id += allowed.charAt(Math.floor(Math.random() * 36));
              }
              exec('node /home/vagrant/project/nodejs/GameServer.js '+id, function (error) {
                if (error !== null) {
                  res.write(JSON.stringify({ error: "Could not start GameServer" }));
                } else {
                  lobbies[id] = { state: 0 };
                  res.write(JSON.stringify({ id: id, state: 0 }));
                }
              });
              res.end();
              break;
            case '/lobbies':
              res.write(JSON.stringify(lobbies));
              res.end();
            default:
              res.end();
              break;
          }
          break;
        case 'POST':
          switch(url.pathname) {
            case '/user_token':
              res.end();
              break;
            default:
              res.end();
              break;
          }
          break;
        case 'DELETE':
          switch(url.pathname) {
            case '/lobby':
              res.end();
              break;
            default:
              res.end();
              break;
          }
          break;
        default:
          res.end();
          break;
      }
    }).listen(8000);
    break;
  default:
    console.log("Usage: node GameCoordinator.js [master/cluster/combined]");
    return;
}