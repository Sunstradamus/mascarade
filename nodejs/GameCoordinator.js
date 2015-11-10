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
    var spawn = require('child_process').spawn,
        http = require('http'),
        parser = require('url').parse;

    var lobbies = {};
    var basePort = 8080;
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
              spawn('node', ['/home/vagrant/project/nodejs/GameServer.js', id, basePort], { detached: true });
              lobbies[id] = { state: 0, port: basePort };
              res.write(JSON.stringify({ id: id, state: 0, port: basePort }));
              res.end();
              basePort += 1;
              if (basePort > 9080) {
                basePort = 8080;
              }
              break;
            case '/lobbies':
              res.write(JSON.stringify(lobbies));
              res.end();
            default:
              res.statusCode = 400;
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
              res.statusCode = 400;
              res.end();
              break;
          }
          break;
        case 'DELETE':
          switch(url.pathname) {
            case '/lobby':
              if (url.query.id) {
                if (lobbies.hasOwnProperty(url.query.id)) {
                  delete lobbies[url.query.id];
                } else {
                  res.statusCode = 404;
                }
              } else {
                res.statusCode = 400;
              }
              res.end();
              break;
            default:
              res.statusCode = 400;
              res.end();
              break;
          }
          break;
        default:
          res.statusCode = 400;
          res.end();
          break;
      }
    }).listen(8000);
    break;
  default:
    console.log("Usage: node GameCoordinator.js [master/cluster/combined]");
    return;
}