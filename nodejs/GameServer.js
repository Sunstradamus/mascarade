if (process.argv.length != 4) {
    console.log("Usage: node GameServer.js [lobby-id] [port]");
    return;
}
var lobbyId = process.argv[2],
    lobbyPort = process.argv[3],
    request = require('http').request,
    WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({ port: lobbyPort, path: '/'+lobbyId });
// TODO: Refactor state enum into its own file
var GameServerState = Object.freeze({
  WAITING_FOR_USERS: 0,
  STARTED_FORCE_SWAP: 1,
  STARTED_NORMAL: 2,
  STARTED_CLAIM_CHARACTER: 3,
  STARTED_CONTEST_CLAIM: 4,
  STARTED_PROCESS_CLAIM: 5,
});
// TODO: Cards in own file
var GameCard = Object.freeze({
  JUDGE: 0,
  BISHOP: 1,
  KING: 2,
  FOOL: 3,
  QUEEN: 4,
  THIEF: 5,
  WITCH: 6,
  SPY: 7,
  PEASANT: 8,
  CHEAT: 9,
  INQUISITOR: 10,
  WIDOW: 11,
});
// TODO: Actions in own file
var GameAction = Object.freeze({
  SWAP_CARD: 0,
  VIEW_OWN_CARD: 1,
  CLAIM_CHARACTER: 2,
});
// TODO: Refactor GS into its own file
var GameServer = function() {

  var self = this;

  self.activityCheck = function() {
    if (self.state === GameServerState.WAITING_FOR_USERS) {
      self.updateGC('exit');
    }
  };

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
        case 5:
          if (msg.username && msg.auth) {
            if (!self.userList.hasOwnProperty(msg.username)) {
              con.terminate();
              break;
            }
            if (self.userList[msg.username].auth === msg.auth && con === self.userList[msg.username].connection) {
              switch(self.state) {
                case GameServerState.STARTED_FORCE_SWAP:
                  if (msg.hasOwnProperty('act') && msg.act === GameAction.SWAP_CARD && msg.hasOwnProperty('target') && msg.hasOwnProperty('fake') && (self.userList.hasOwnProperty(msg.target) || (msg.target === 0 && msg.target < self.centerCards.length) || (msg.target === 1 && msg.target < self.centerCards.length))) {
                    clearTimeout(self.gameLoop);
                    if (msg.fake) {
                      // Fake swap
                    } else {
                      // Real swap
                      if (msg.target === 0 || msg.target === 1) {
                        var temp;
                        temp = self.userList[msg.username].card;
                        self.userList[msg.username].card = self.centerCards[msg.target];
                        self.centerCards[msg.target] = temp;
                      } else {
                        var temp;
                        temp = self.userList[msg.username].card;
                        self.userList[msg.username].card = self.userList[msg.target].card;
                        self.userList[msg.target].card = temp;
                      }
                    }
                    self.broadcast(JSON.stringify({ id: 200, target: msg.target }));
                    self.forceSwapCount += 1;
                    if (self.forceSwapCount === 4) {
                      self.state = GameServerState.STARTED_NORMAL;
                    }
                    self.gameLoop = setTimeout(self.processGameState, 30000);
                    self.processGameState();
                  } else {
                    // Bad packet
                    con.send(JSON.stringify({ id: 103 }));
                  }
                  break;
                case GameServerState.STARTED_NORMAL:
                  if (msg.hasOwnProperty('act')) {
                    switch(msg.act) {
                      case GameAction.SWAP_CARD:
                        if (msg.hasOwnProperty('target') && msg.hasOwnProperty('fake') && (self.userList.hasOwnProperty(msg.target) || (msg.target === 0 && msg.target < self.centerCards.length) || (msg.target === 1 && msg.target < self.centerCards.length))) {
                          clearTimeout(self.gameLoop);
                          if (msg.fake) {
                            // Fake swap
                          } else {
                            // Real swap
                            if (msg.target === 0 || msg.target === 1) {
                              var temp;
                              temp = self.userList[msg.username].card;
                              self.userList[msg.username].card = self.centerCards[msg.target];
                              self.centerCards[msg.target] = temp;
                            } else {
                              var temp;
                              temp = self.userList[msg.username].card;
                              self.userList[msg.username].card = self.userList[msg.target].card;
                              self.userList[msg.target].card = temp;
                            }
                          }
                          self.broadcast(JSON.stringify({ id: 200, target: msg.target }));
                          self.gameLoop = setTimeout(self.processGameState, 30000);
                          self.processGameState();
                        } else {
                          con.send(JSON.stringify({ id: 103 }));
                        }
                        break;
                      case GameAction.VIEW_OWN_CARD:
                        clearTimeout(self.gameLoop);
                        con.send(JSON.stringify({ card: self.userList[msg.username].card }));
                        self.broadcast(JSON.stringify({ id: 201 }));
                        self.gameLoop = setTimeout(self.processGameState, 30000);
                        self.processGameState();
                        break;
                      case GameAction.CLAIM_CHARACTER:
                        // Commented out so you can't break the server.
                        /* if (msg.hasOwnProperty('character') && (self.playerCards.indexOf(msg.character) > -1)) {
                          clearTimeout(self.gameLoop);
                          self.state = GameServerState.STARTED_CLAIM_CHARACTER;
                          self.characterOwner = self.playerList.indexOf(msg.username);
                          self.claimedCharacter = msg.character;
                          self.broadcast(JSON.stringify({ id: 202, claimed: msg.character }));
                          self.gameLoop = setTimeout(self.processGameState, 30000);
                          self.processGameState();
                        } else {
                          con.send(JSON.stringify({ id: 103 }));
                        } */
                        break;
                      default:
                        con.send(JSON.stringify({ id: 103 }));
                        break;
                    }
                  } else {
                    con.send(JSON.stringify({ id: 103 }));
                  }
                  break;
                default:
                  con.send(JSON.stringify({ id: 103 }));
                  break;
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
        case 6:
          if (msg.username && msg.auth) {
            // Check if user is even authenticated for our server
            if (!self.userList.hasOwnProperty(msg.username)) {
              con.terminate();
              break;
            }
            if (self.userList[msg.username].auth === msg.auth && con === self.userList[msg.username].connection) {
              if (self.state === GameServerState.STARTED_CLAIM_CHARACTER && msg.hasOwnProperty('contest')) {
                if (msg.contest) {
                  self.contester.push(msg.username);
                }
                self.contestCounter += 1;
                if (self.contestCounter === self.playerList.length) {
                  clearTimeout(self.gameLoop);
                  self.STARTED_CONTEST_CLAIM;
                  self.gameLoop = setTimeout(self.processGameState, 30000);
                  self.processGameState();
                }
              } else {
                con.send(JSON.stringify({ id: 103 }));
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
        // Using 999, 998 to check connection vars & exit conditions, remove once I figure out how websockets work when clients disconnect
        case 999:
          if (con === self.userList[msg.username].connection) {
            con.send("TRUE");
          } else {
            con.send("FALSE");
          }
          break;
        case 998:
          self.updateGC('exit');
          break;
        // Temp force game start
        case 997:
          self.userList['fakeuser1'] = { connection: con, auth: '123' };
          self.userList['fakeuser2'] = { connection: con, auth: '234' };
          self.userList['fakeuser3'] = { connection: con, auth: '345' };
          self.startGame();
          break;
        // Junk message received, ignore it (Or terminate connection?)
        default:
          break;
      }
    });

    // Authentication request to client
    con.send(JSON.stringify({ id: 1 }));
  };

  self.advanceTurn = function() {
    self.turn = (self.turn + 1) % self.playerList.length;
  }

  self.broadcast = function(msg) {
    for (var i = self.playerList.length - 1; i >= 0; i--) {
      self.userList[self.playerList[i]].connection.send(msg);
    };
  };

  self.checkGameEnd = function() {
    // Check if someone hits 0 to end the game; may have ties
    if (self.playerCoins.indexOf(0) > -1) {
      var playerIndex = -1;
      var maxCoins = 0;
      var winCounter = 0;
      var ties = [];
      for (var i = self.playerCoins.length - 1; i >= 0; i--) {
        if (self.playerCoins[i] > maxCoins) {
          playerIndex = i;
          maxCoins = self.playerCoins[i];
        }
      };
      for (var i = self.playerCoins.length - 1; i >= 0; i--) {
        if (self.playerCoins[i] === maxCoins) {
          winCounter += 1;
          ties.push(i);
        }
      };
      if (winCounter === 1) {
        self.endGame(playerIndex);
      } else {
        self.endGame(ties);
      }
    }
    // Hitting 13 means there aren't any possible ties except for the Peasant, who gets his own victory check in process_claim along with the cheat
    var winner = self.playerCoins.indexOf(13);
    if (winner > -1) {
      self.endGame(winner);
    }
  }

  self.dealCards = function() {
    switch(self.playerList.length) {
      case 4:
        var cards = [GameCard.JUDGE, GameCard.BISHOP, GameCard.KING, GameCard.QUEEN, GameCard.THIEF, GameCard.CHEAT];
        cards = self.shuffle(cards);
        for (var i = self.playerList.length - 1; i >= 0; i--) {
          self.userList[self.playerList[i]].card = cards[i];
          self.playerCards[i] = cards[i];
        };
        self.centerCards = [cards[4], cards[5]];
        return;
      case 5:
        var cards = [GameCard.JUDGE, GameCard.BISHOP, GameCard.KING, GameCard.QUEEN, GameCard.WITCH, GameCard.CHEAT];
        cards = self.shuffle(cards);
        for (var i = self.playerList.length - 1; i >= 0; i--) {
          self.userList[self.playerList[i]].card = cards[i];
          self.playerCards[i] = cards[i];
        };
        self.centerCards = [cards[5]];
        return;
      case 6:
        var cards = [GameCard.JUDGE, GameCard.BISHOP, GameCard.KING, GameCard.QUEEN, GameCard.WITCH, GameCard.CHEAT];
        cards = self.shuffle(cards);
        for (var i = self.playerList.length - 1; i >= 0; i--) {
          self.userList[self.playerList[i]].card = cards[i];
          self.playerCards[i] = cards[i];
        };
        self.centerCards = [];
        return;
      case 7:
        var cards = [GameCard.JUDGE, GameCard.BISHOP, GameCard.KING, GameCard.FOOL, GameCard.QUEEN, GameCard.THIEF, GameCard.WITCH];
        cards = self.shuffle(cards);
        for (var i = self.playerList.length - 1; i >= 0; i--) {
          self.userList[self.playerList[i]].card = cards[i];
          self.playerCards[i] = cards[i];
        };
        self.centerCards = [];
        return;
      case 8:
        var cards = [GameCard.JUDGE, GameCard.BISHOP, GameCard.KING, GameCard.FOOL, GameCard.QUEEN, GameCard.WITCH, GameCard.PEASANT, GameCard.PEASANT];
        cards = self.shuffle(cards);
        for (var i = self.playerList.length - 1; i >= 0; i--) {
          self.userList[self.playerList[i]].card = cards[i];
          self.playerCards[i] = cards[i];
        };
        self.centerCards = [];
        return;
      case 9:
        var cards = [GameCard.JUDGE, GameCard.BISHOP, GameCard.KING, GameCard.FOOL, GameCard.QUEEN, GameCard.WITCH, GameCard.PEASANT, GameCard.PEASANT, GameCard.CHEAT];
        cards = self.shuffle(cards);
        for (var i = self.playerList.length - 1; i >= 0; i--) {
          self.userList[self.playerList[i]].card = cards[i];
          self.playerCards[i] = cards[i];
        };
        self.centerCards = [];
        return;
      case 10:
        var cards = [GameCard.JUDGE, GameCard.BISHOP, GameCard.KING, GameCard.FOOL, GameCard.QUEEN, GameCard.WITCH, GameCard.SPY, GameCard.PEASANT, GameCard.PEASANT, GameCard.CHEAT];
        cards = self.shuffle(cards);
        for (var i = self.playerList.length - 1; i >= 0; i--) {
          self.userList[self.playerList[i]].card = cards[i];
          self.playerCards[i] = cards[i];
        };
        self.centerCards = [];
        return;
      case 11:
        var cards = [GameCard.JUDGE, GameCard.BISHOP, GameCard.KING, GameCard.FOOL, GameCard.QUEEN, GameCard.WITCH, GameCard.SPY, GameCard.PEASANT, GameCard.PEASANT, GameCard.CHEAT, GameCard.INQUISITOR];
        cards = self.shuffle(cards);
        for (var i = self.playerList.length - 1; i >= 0; i--) {
          self.userList[self.playerList[i]].card = cards[i];
          self.playerCards[i] = cards[i];
        };
        self.centerCards = [];
        return;
      case 12:
        var cards = [GameCard.JUDGE, GameCard.BISHOP, GameCard.KING, GameCard.FOOL, GameCard.QUEEN, GameCard.WITCH, GameCard.SPY, GameCard.PEASANT, GameCard.PEASANT, GameCard.CHEAT, GameCard.INQUISITOR, GameCard.WIDOW];
        cards = self.shuffle(cards);
        for (var i = self.playerList.length - 1; i >= 0; i--) {
          self.userList[self.playerList[i]].card = cards[i];
          self.playerCards[i] = cards[i];
        };
        self.centerCards = [];
        return;
      case 13:
        var cards = [GameCard.JUDGE, GameCard.BISHOP, GameCard.KING, GameCard.FOOL, GameCard.QUEEN, GameCard.THIEF, GameCard.WITCH, GameCard.SPY, GameCard.PEASANT, GameCard.PEASANT, GameCard.CHEAT, GameCard.INQUISITOR, GameCard.WIDOW];
        cards = self.shuffle(cards);
        for (var i = self.playerList.length - 1; i >= 0; i--) {
          self.userList[self.playerList[i]].card = cards[i];
          self.playerCards[i] = cards[i];
        };
        self.centerCards = [];
        return;
      default:
        return;
    }
  };

  self.endGame = function(winners) {
    if (typeof winner === 'number') {
      self.broadcast(JSON.stringify({ id: 104, winner: winners }));
    } else {
      self.broadcast(JSON.stringify({ id: 105, players: winners }));
    }
    self.updateGC('exit');
  }

  self.initialize = function() {
    self.centerCards;
    self.gameLoop;
    self.playerList;
    self.characterOwner = -1;
    self.claimedCharacter = -1;
    self.contestCounter = 0;
    self.contester = [];
    self.courtCoins = 0;
    self.doneWaiting = false;
    self.lobbyHost = '';
    self.playerCards = [];
    self.playerCoins = [];
    self.state = GameServerState.WAITING_FOR_USERS;
    self.userList = {};

    /*process.on('uncaughtException', function(err) {
      console.log("Caught Exception: "+err);

      // Send GC a notification that the server crashed (is about to exit)
      process.exit();
    });*/
    setTimeout(self.activityCheck, 300000);
  };

  self.processGameState = function() {
    clearTimeout(self.gameLoop);
    self.checkGameEnd();
    self.gameLoop = setTimeout(self.processGameState, 30000);
    switch(self.state) {
      case GameServerState.STARTED_FORCE_SWAP:
        self.advanceTurn();
        self.broadcast(JSON.stringify({ state: self.state, players: self.playerList, playerCoins: self.playerCoins, turn: self.turn }));
        self.userList[self.playerList[self.turn]].connection.send(JSON.stringify({ id: 5, actions: GameAction.SWAP_CARD }));
        break;
      case GameServerState.STARTED_NORMAL:
        self.advanceTurn();
        self.broadcast(JSON.stringify({ state: self.state, players: self.playerList, playerCoins: self.playerCoins, turn: self.turn }));
        self.userList[self.playerList[self.turn]].connection.send(JSON.stringify({ id: 5, actions: GameAction.SWAP_CARD | GameAction.VIEW_OWN_CARD | GameAction.CLAIM_CHARACTER }));
        break;
      case GameServerState.STARTED_CLAIM_CHARACTER:
        if (self.doneWaiting) {
          self.doneWaiting = false;
          if (self.contestCounter > 0) {
            self.state = GameServerState.STARTED_CONTEST_CLAIM;
          } else {
            self.state = GameServerState.STARTED_PROCESS_CLAIM;
          }
          clearTimeout(self.gameLoop);
          setImmediate(self.processGameState);
          return;
        } else {
          self.broadcast(JSON.stringify({ state: self.state, players: self.playerList, playerCoins: self.playerCoins, turn: self.turn, claimed: self.claimedCharacter }));
          self.doneWaiting = true;
        }
        break;
      case GameServerState.STARTED_CONTEST_CLAIM:
        var cards = [];
        if (self.userList[self.playerList[self.turn]].card === self.claimedCharacter) {
          self.characterOwner = self.turn;
          cards[self.turn] = self.claimedCharacter;
          while (self.contester.length > 0) {
            var player = self.contester.pop();
            var playerIndex = self.playerList.indexOf(user);
            self.playerCoins[playerIndex] -= 1;
            self.courtCoins += 1;
            cards[playerIndex] = self.userList[player].card;
          }
          self.broadcast(JSON.stringify({ state: self.state, players: self.playerList, playerCoins: self.playerCoins, revealedCards: cards, turn: self.turn }));
          self.state = GameServerState.STARTED_PROCESS_CLAIM;
          clearTimeout(self.gameLoop);
          setImmediate(self.processGameState);
        } else {
          cards[self.turn] = self.userList[self.playerList[self.turn]].card;
          self.playerCoins[self.turn] -= 1;
          self.courtCoins += 1;
          while (self.contester.length > 0) {
            var player = self.contester.pop();
            var playerIndex = self.playerList.indexOf(user);
            cards[playerIndex] = self.userList[player].card;
            if (self.userList[player].card === self.claimedCharacter) {
              self.characterOwner = playerIndex;
            } else {
              self.courtCoins += 1;
              self.playerCoins[playerIndex] -= 1;
            }
          }
          self.broadcast(JSON.stringify({ state: self.state, players: self.playerList, playerCoins: self.playerCoins, revealedCards: cards, turn: self.turn }));
          self.state = GameServerState.STARTED_PROCESS_CLAIM;
          clearTimeout(self.gameLoop);
          setImmediate(self.processGameState);
        }
        break;
      case GameServerState.STARTED_PROCESS_CLAIM:
        switch(self.claimedCharacter) {
          case GameCard.JUDGE:
            self.playerCoins[self.characterOwner] += self.courtCoins;
            self.courtCoins = 0;
            break;
          case GameCard.BISHOP:
            var richestPlayer = -1;
            var maxCoins = 0;
            for (var i = self.playerCoins.length - 1; i >= 0; i--) {
              if (self.playerCoins[i] > maxCoins) {
                richestPlayer = i;
                maxCoins = self.playerCoins[i];
              }
            };
            self.playerCoins[self.characterOwner] += 2;
            self.playerCoins[richestPlayer] -= 2;
            break;
          case GameCard.KING:
            self.playerCoins[self.characterOwner] += 3;
            break;
          case GameCard.FOOL:
            self.playerCoins[self.characterOwner] += 1;
            self.userList[self.playerList[self.characterOwner]].connection.send({ id: 203 });
            self.state = GameServerState.STARTED_ADDITIONAL_PROCESS;
            clearTimeout(self.gameLoop);
            setImmediate(self.processGameState);
            break;
          case GameCard.QUEEN:
            self.playerCoins[self.characterOwner] += 2;
            break;
          case GameCard.THIEF:
            var left = (self.characterOwner - 1) % self.playerList.length;
            var right = (self.characterOwner + 1) % self.playerList.length;
            self.playerCoins[self.characterOwner] += 2;
            self.playerCoins[left] -= 1;
            self.playerCoins[right] -= 1;
            break;
          case GameCard.WITCH:
            break;
          case GameCard.SPY:
            break;
          case GameCard.PEASANT:
            break;
          case GameCard.CHEAT:
            if (self.playerCoins[self.characterOwner] >= 10) {
              clearTimeout(self.gameLoop);
              self.endGame(self.characterOwner);
            }
            break;
          case GameCard.INQUISITOR:
            break;
          case GameCard.WIDOW:
            if (self.playerCoins[self.characterOwner] <= 10) {
              self.playerCoins[self.characterOwner] = 10;
            }
            break;
        }
        break;
    }
  };

  self.shuffle = function(array) {
    // Fisher-Yates shuffle
    var len = array.length, temp, index;

    while (len) {
      index = Math.floor(Math.random() * len--);
      temp = array[len];
      array[len] = array[index];
      array[index] = temp;
    }

    return array;
  };

  self.startGame = function() {
    var players = Object.keys(self.userList);
    if (players.length < 4) {
      self.userList[self.lobbyHost].connection.send(JSON.stringify({ id: 101 }));
    } else if (players.length > 13) {
      self.userList[self.lobbyHost].connection.send(JSON.stringify({ id: 102 }));
    } else {
      self.state = GameServerState.STARTED_FORCE_SWAP;
      self.playerList = players;
      for (var i = players.length - 1; i >= 0; i--) {
        self.playerCoins[i] = 6;
      };
      self.turn = -1;
      self.forceSwapCount = 0;
      self.dealCards();
      self.broadcast(JSON.stringify({ players: self.playerList, playerCards: self.playerCards, playerCoins: self.playerCoins, middle: self.centerCards }));
      // Start the game loop
      self.gameLoop = setTimeout(self.processGameState, 30000);
      // Start the game
      self.processGameState();
    }
  };

  self.updateGC = function(status) {
    switch(status) {
      case 'exit':
        var req = request({ hostname: 'localhost', port: '8000', path: '/lobby?id='+lobbyId, method: 'DELETE' }, function(res) {
          console.log(res.statusCode);
          process.exit();
        }).on('error', function(err) {
          console.log(err);
        }).end();
        return;
      default:
        return;
    }
  };

};

var gs = new GameServer();
gs.initialize();
wss.on('connection', function connection(ws) {
  gs.addUser(ws);
});