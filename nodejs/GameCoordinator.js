if (process.argv.length != 3) {
  console.log("Usage: node GameCoordinator.js [master/cluster/combined]");
  return;
}
var mode = process.argv[2];
var SECRET_KEY = "9bbe65e4e477b13ca45b45f35cd4222e1c475b6dbc1604e9caaadd26e2e6179e";
var LOBBY_KEY = "e2544fce5d32505719ee76d6ed53b293775044fcad108ec63460bd6a19b5007b";
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
        hmac = require('crypto').createHmac,
        parser = require('url').parse,
        parsePost = require('querystring').parse,
        GameServerState = require('./GameConstants.js').GameServerState;

    var lobbies = {};
    var userTokens = {};
    var basePort = 8080;
    http.createServer(function(req, res) {
      var url = parser(req.url, true);
      res.setHeader("Content-Type", "application/json; charset=UTF-8");
      res.setHeader("Access-Control-Allow-Origin", "http://localhost:8000");
      switch(req.method) {
        case 'GET':
          switch(url.pathname) {
            case '/user_token':
              if (url.query.username && url.query.id && url.query.key) {
                // TODO: Generate unique symmetric key for lobby
                if (lobbies.hasOwnProperty(url.query.id) && userTokens.hasOwnProperty(url.query.username) && url.query.key === LOBBY_KEY) {
                  res.write(JSON.stringify({ token: userTokens[url.query.username] }));
                  delete userTokens[url.query.username];
                } else {
                  res.statusCode = 404;
                }
              } else {
                res.statusCode = 400;
              }
              res.end();
              break;
            case '/new_lobby':
              var id = "";
              var allowed = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
              for (var i = 0; i < 5; i++) {
                id += allowed.charAt(Math.floor(Math.random() * 36));
              }
              //spawn('node', ['/home/vagrant/project/nodejs/GameServer.js', id, basePort, LOBBY_KEY], { detached: true, stdio: ['ignore', process.stdout, process.stderr] });
              spawn('node', ['/home/vagrant/project/nodejs/GameServer.js', id, basePort, LOBBY_KEY], { detached: true });
              lobbies[id] = { state: GameServerState.WAITING_FOR_USERS, port: basePort };
              res.write(JSON.stringify({ id: id, state: GameServerState.WAITING_FOR_USERS, port: basePort }));
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
              if (url.query.username) {
                var body = '';
                req.on('data', function (data) {
                  body += data;
                  if (body.length > 1e6) {
                    req.connection.destroy();
                  }
                });
                req.on('end', function() {
                  var post = parsePost(body);
                  var hash = hmac('sha512', SECRET_KEY).update(post.token).digest('hex');
                  if (post.signature === hash) {
                    userTokens[url.query.username] = post.token;
                    res.statusCode = 200;
                  } else {
                    res.statusCode = 403;
                  }
                });
              } else {
                res.statusCode = 400;
              }
              res.end();
              break;
            case '/error':
              if (url.query.id && url.query.key) {
                if (lobbies.hasOwnProperty(url.query.id) && url.query.key === LOBBY_KEY) {
                  var body = '';
                  req.on('data', function (data) {
                    body += data;
                    if (body.length > 1e6) {
                      req.connection.destroy();
                    }
                  });
                  req.on('end', function() {
                    var post = parsePost(body);
                    console.log("Lobby ID "+url.query.id+" has crashed");
                    console.log("["+url.query.id+"]: "+post.msg);
                    delete lobbies[url.query.id];
                    res.end();
                  });
                } else {
                  res.statusCode = 400;
                  res.end();
                }
              } else {
                res.statusCode = 400;
                res.end();
              }
              break;
            case '/winner':
              if (url.query.id && url.query.key) {
                if (lobbies.hasOwnProperty(url.query.id) && url.query.key === LOBBY_KEY) {
                  var body = '';
                  req.on('data', function (data) {
                    body += data;
                    if (body.length > 1e6) {
                      req.connection.destroy();
                    }
                  });
                  req.on('end', function() {
                    var post = JSON.parse(body);
                    var winners = "";
                    for (var i = post.length - 1; i >= 0; i--) {
                      winners += post[i] + ", "
                    };
                    console.log("Lobby ID "+url.query.id+" has ended with winners: "+winners);
                    delete lobbies[url.query.id];
                    res.end();
                  });
                } else {
                  res.statusCode = 400;
                  res.end();
                }
              } else {
                res.statusCode = 400;
                res.end();
              }
              break;
            case '/update':
              if (url.query.id && url.query.key) {
                if (lobbies.hasOwnProperty(url.query.id) && url.query.key === LOBBY_KEY) {
                  var body = '';
                  req.on('data', function (data) {
                    body += data;
                    if (body.length > 1e6) {
                      req.connection.destroy();
                    }
                  });
                  req.on('end', function() {
                    var post = JSON.parse(body);
                    lobbies[url.query.id].state = post.state;
                    lobbies[url.query.id].players = post.players;
                    if (post.state === GameServerState.WAITING_FOR_USERS) {
                      lobbies[url.query.id].host = post.host;
                    } else {
                      lobbies[url.query.id].playerCoins = post.playerCoins;
                      lobbies[url.query.id].courtCoins = post.courtCoins;
                    }
                    res.end();
                  });
                } else {
                  res.statusCode = 400;
                  res.end();
                }
              } else {
                res.statusCode = 400;
                res.end();
              }
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
                  res.statusCode = 200;
                } else {
                  res.statusCode = 404;
                }
              } else {
                res.statusCode = 400;
              }
              res.end();
              break;
            case '/user_token':
              if (url.query.username && url.query.signature) {
                var hash = hmac('sha512', SECRET_KEY).update("delete").digest('hex');
                if (url.query.signature === hash) {
                  delete userTokens[url.query.username];
                  res.statusCode = 200;
                } else {
                  res.statusCode = 403;
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
    console.log("GameCoordinator in combined mode listening on 8000");
    break;
  default:
    console.log("Usage: node GameCoordinator.js [master/cluster/combined]");
    return;
}