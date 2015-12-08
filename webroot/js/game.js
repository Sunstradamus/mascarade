'use strict';

var Box = React.createClass({
  
  DEBUG: false,  // change to enable the start with 12 fake users and a custom server message bar
  TIMER_LENGTH: 28, // client side, server will always be 30 seconds
  
  // store basically all state in Box, pass to children as props
  
  displayName: 'Box',

  // ----------------------------------------------------------- getDefaultProps
  getDefaultProps: function getDefaultProps() {
    return { username: 'user' };
  },
  
  // ----------------------------------------------------------- getInitialState
  getInitialState: function getInitialState() {
    return {
      turn: -1,                  // index of player who's turn it is
      token: this.props.token,   // for authenticating
      players: [],               // player names
      playerCards: [],           // variable list of which cards players are known to have
      playerCoins:[],            // number of coins each player has
      entries: [],               // log entries
      myTurn: false,             // flag indicating this user's turn
      needTarget: false,         // flag indicating user should select from cards on field
      middle: [],                // array to store non-human cards
      actions: 0,                // possible actions user can take
      gameCards: [],             // static list of cards in the game
      gameState: 0,              // server-side identifiers
      gameStateSpecial: 0,       // client side identifiers to set up the action area properly
      myCard: -1,                // card that the user currently has
      revealedCards: {},         // cards that were revealed during a contest (not used I think)
      needMultiTarget: false,    // user needs to select two targets from playing field (used for fool)
      multiTarget: [],           // the cards that the user selected
      preservedTarget: {},       // used to store the last card the user picked (used for spy)
      courtCoins: 0,             // coins in the courthouse
      firstTurnFlag: true,       // special flag to tell react not to hide which cards people have before the game starts
      timerInterval: null,       // interval javascript variable for the timer
      debug: this.DEBUG,         // if true, show the custom message field
      hasWinner: false,          // somebody has won 
      host: false                // user is host of this lobby
    };
  },

  // --------------------------------------------------------- componentDidMount
  componentDidMount: function componentDidMount() {
    var params = location.search.split('&port=');
    var port = params[1];
    var lobbyID = params[0].split('lobby=')[1];

    var socketURL = url(port, lobbyID);
    var websocket = new WebSocket(socketURL);
    websocket.addEventListener('open', this.onOpen);
    websocket.addEventListener('close', this.onClose);
    websocket.addEventListener('message', this.onMessage);
    websocket.addEventListener('error', this.onError);
    this.setState({ websocket: websocket });
  },
  
  CHARACTERS: [
    'judge',
    'bishop',
    'king',
    'fool',
    'queen',
    'theif',
    'witch',
    'spy',
    'peasant',
    'cheat',
    'inquisitor',
    'widow'
  ],

  // ----------------------------------------------------------- socketCallbacks
  onOpen: function onOpen(e) {
    console.log("websocket opened");
  },

  onClose: function onClose(e) {
    console.log("websocket closed");
    if(!this.state.hasWinner) {
      window.location.href = '/';
    }
  },

  onError: function onError(e) {
    console.log(e.data);
  },

  onMessage: function onMessage(e) {
    var msg = JSON.parse(e.data);
    
    if(!msg.hasOwnProperty('id')) {
      
      if( (msg.hasOwnProperty('state') && msg['state'] != this.state.gameState) ||
           msg.hasOwnProperty('turn') && msg['turn'] != this.state.turn ) {
        
             if (this.state.timerInterval != null) {
               clearInterval(this.state.timerInterval);
             }
             this.setState({ timerInterval: startTimer(this.TIMER_LENGTH) });
      }
      
      var cards = [];
      if( msg.hasOwnProperty('revealedCards')) {
        cards = msg['revealedCards'];
        this.setState({ firstTurnFlag: true });
      } 
      else if( msg.hasOwnProperty('playerCards')) {
        cards = msg['playerCards'];
      }

      if( cards.length == 0 && ( this.state.firstTurnFlag || (msg.hasOwnProperty('turn') && msg['turn'] == this.state.turn) ) ) {
        cards = this.state.playerCards;
      }    
      this.setState({ playerCards: cards });
      
      if( msg.hasOwnProperty('turn') && msg['turn'] != this.state.turn ) {
        
        this.setState(function (prevState, currProps) {
          var myTurn;
          if ( this.state.players[msg['turn']] != this.props.username ) {
            prevState.entries.push({ 'private': false, 'message': "It's " + prevState.players[msg['turn']] + "'s turn!"});
            myTurn = false;
          }
          else {
            prevState.entries.push({ 'private': false, 'message': "It's your turn!"});
            myTurn = true
          }
          
          // current turn changed; remove potentially lying around intermediate states
          
          return { entries: prevState.entries,
                   myCard: -1,
                   myTurn: myTurn,
                   needTarget: false,
                   needMultiTarget: false,
                   gameStateSpecial: 0,
                   multiTarget: [],
                   firstTurnFlag: false };
        });
      
      } 
      
      if(msg.hasOwnProperty('card')) {
        this.setState(function (prevState, currProps) {
          prevState.entries.push({ 'private': true, 'message': "Your card is the " + this.CHARACTERS[msg['card']] });
          return { entries: prevState.entries };
        });
      }
      
      else {
      

      
        this.setState({ 
          gameState: msg['state'],
          gameCards: msg.hasOwnProperty('playerCards') ? msg['playerCards'] : this.state.gameCards,
          players: msg.hasOwnProperty('players') ? msg['players'] : this.state.players,
          playerCoins: msg.hasOwnProperty('playerCoins') ? msg['playerCoins'] : this.state.playerCoins,
          middle: msg.hasOwnProperty('middle') ? msg['middle'] : [],
          turn: msg.hasOwnProperty('turn') ? msg['turn'] : this.state.turn,
          courtCoins: msg.hasOwnProperty('courtCoins') ? msg['courtCoins'] : this.state.courtCoins
        });
      }
    }
    else {
      
      switch (msg['id']) {
        case 1:
          // Authentication requested     
          this.state.websocket.send(JSON.stringify({ id: 1, username: this.props.username, token: this.state.token }));
          break;
        case 2:
          // Authentication approved
          this.setState({ auth: msg['auth'] });
          if( msg.hasOwnProperty('users') && msg.users.length > 0) {
            this.setState(function (prevState, currProps) {
              for( var i = 0 ; i < msg['users'].length ; i++ ) {
                prevState.entries.push({ 'private': false, 'message': msg['users'][i] + " has connected to the game lobby." });
              }
            return { entries: prevState.entries };
          }); 
          }
          break;
        case 5:
          // Turn notification & actions permitted
          this.setState( { myTurn: true, actions: msg['actions'] } );
          
          break;
        case 8:
          // Authentication rejected
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': true, 'message': "Could not determine authenticity of client. Retrying..." });
            return { entries: prevState.entries };
          });
          var self = this; // meta
          $.ajax({
            method: "GET",
            url: "/new-token.php",
            success: function(data) {
              msg = JSON.parse(data);
              if( msg["token"] == "" ) {
                self.setState(function (prevState, currProps) {
                  prevState.entries.push({ 'private': true, 'message': "Authentication failed. Cannot join lobby." });
                  return { entries: prevState.entries };
                });
              }
              else {
                self.setState({ token: msg["token"]});
                self.state.websocket.send(JSON.stringify({ id: 1, username: self.props.username, token: self.state.token }));
              }
            },
          });          
          break;
        case 10:
        
          // If you don't like having chat messages in the game log, feel free to change this
        
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': false, chat: true, 'message': msg['user'] + ": " + msg['msg'] });
            return { entries: prevState.entries, actions: msg['actions'] };
          });
          break;
        case 12:
          // user joined the room
          this.setState( function (prevState, currProps) {
            prevState.entries.push({ 'private': false, 'message': msg['user'] + " has connected to the game lobby." });
            return { entries: prevState.entries };
          });
          break;
        case 13:
          // user left the room
          this.setState( function (prevState, currProps) {
            prevState.entries.push({ 'private': false, 'message': msg['user'] + " has left the lobby." });
            return { entries: prevState.entries };
          });
          break;
        case 14:
          // you are the host
          this.setState( function (prevState, currProps) {
            prevState.entries.push({ 'private': true, 'message': "You are the host of this lobby!" });
            return { entries: prevState.entries, host: true };
          });
          break;
        case 100:
          // Regenerated authentication key
          this.setState({ auth: msg['auth'] });
          break;
        case 101:
          // Insufficient users to start game
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': true, 'message': 'Insufficient users to start game' });
            return { entries: prevState.entries };
          });
          break;
        case 102:
          // Insufficient users to start game
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': false, 'message': 'Too many users to start game' });
            return { entries: prevState.entries };
          });
          break;
        case 103:
          // Invalid Action
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': true, 'message': 'Invalid Action' });
            return { entries: prevState.entries };
          });
          break;
        case 104:
          // Game Over, one winner
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': false, 'message': "Game Over! " + prevState.players[msg['winner']] + " wins!" });
            return { entries: prevState.entries, hasWinner: true };
          });
          break;
        case 105:
          // Game Over, multiple winners
          this.setState(function (prevState, currProps) {
            var winners = []
            for( var i = 0 ; i < msg['players'].length ; i++) {
              winners.push( prevState.players[msg['players']] );
            }
            prevState.entries.push({ 'private': false, 'message': "Game Over! " + winners.join(', ') + " win!" });
            return { entries: prevState.entries, hasWinner: true };
          });
          break;
        case 200:
          // Player has swapped or not with target player
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': false, 'message': prevState.players[prevState.turn] + " might have swapped with " + (msg['target'] < 2 ? "middle card " + msg['target'] : msg['target']) });
            return { entries: prevState.entries };
          });
          break;
        case 201:
          // A player has looked at their own card
          if( this.state.players[this.state.turn] != this.props.username ) {
            
            this.setState(function (prevState, currProps) {
              prevState.entries.push({ 'private': false, 'message': prevState.players[prevState.turn] + " checked their card" });
              return { entries: prevState.entries };
            });
          
          }
          break;
        case 202:
          // Player has claimed a character
          this.setState(function (prevState, currProps) {
            if( prevState.players[prevState.turn] == currProps.username ) {
              prevState.entries.push({ 'private': false, 'message': "You have claimed " + CHARACTERS[msg['claimed']] + "! Please wait while other players decide whether to contest." });
              return { entries: prevState.entries, gameStateSpecial: 996 };
            }
            else {
              prevState.entries.push({ 'private': false, 'message': prevState.players[prevState.turn] + " is claiming " + CHARACTERS[msg['claimed']] });
              return { entries: prevState.entries };
            }
          });
          break;
        case 203:
          // Do the fool action
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': true, 'message': 'Fool! Pick two cards and swap them (or fake swap)'  });
            return { entries: prevState.entries, needMultiTarget: true, needTarget: true, gameStateSpecial: 997 };
          });
          break;
        case 204:
          // Witch, select player to swap fortunes with
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': true, 'message': 'Select a player to swap fortunes with' });
            return { entries: prevState.entries, needTarget: true, targetMessage: {} };
          });
          break;
        case 205:
          // Spy, look at your card and another one; then swap or not
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': true, 'message': 'Select a player check the card of.' });
            return { entries: prevState.entries, myCard: msg['card'], needTarget: true, targetMessage: {}, preservedTarget: { 'needed': true }, gameStateSpecial: 997 };
          });
          break;
        case 206:
          // Inquisitor, select a user to inquire
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': true, 'message': 'Select a player to interrogate' });
            return { entries: prevState.entries, needTarget: true, targetMessage: {} };
          });
          break;
        case 207:
          // Spy, other player's card
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': true, 'message': 'Choose whether or not to swap' });
            prevState.preservedTarget['card'] = msg['card'];
            return { entries: prevState.entries, preservedTarget: prevState.preservedTarget, gameStateSpecial: 999 };
          });
          break;
        case 208:
          // You're being inquiried
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': true, 'message': 'You are being interoggated! Guess you card' });
            return { entries: prevState.entries, gameStateSpecial: 998 };
          });
          break;
        case 209:
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': false, 'message': msg['target'] + " and " + msg['other'] + " might have had their cards swapped!" });
            return { entries: prevState.entries };
          });
          break;
        case 210:
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': false, 'message': prevState.players[msg['target']] + " had their fortune swapped!" });
            return { entries: prevState.entries };
          });
          break;
        case 211:
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': false, 'message': prevState.players[msg['target']] + " might have had their card swapped with the spy!" });
            return { entries: prevState.entries };
          });
          break;
        case 212:
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': false, 'message': prevState.players[msg['target']] + " is being interrogated!" });
            return { entries: prevState.entries };
          });
          break;
        default:
          // Not sure what happened
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': false, 'message': 'not sure what just happened...' });
            return { entries: prevState.entries };
          });
        
      }
    }
    
    
    
  },
  
  // --------------------------------------------------------------- buildMessage
  buildMessage: function(id) {
    return({ id: id, username: this.props.username, auth: this.state.auth });
  },
  
  
  // ------------------------------------------ Different actions to send server
  startGame: function(e) { 
    var messageToSend = this.buildMessage(3);
    this.state.websocket.send( JSON.stringify( messageToSend ));
  },
 
  sendAction: function(message) {
    var id = message.hasOwnProperty('act') ? 5 : 7 // no act means it's a character
    var messageToSend = this.buildMessage(id);
    
    if(this.state.gameStateSpecial == 999 && this.state.multiTarget.length > 1) { // special stuff for fool
      messageToSend['target'] = this.state.multiTarget[0];
      messageToSend['other'] = this.state.multiTarget[1];
      this.setState({ needMultiTarget: false, needTarget: false, multiTarget: [] });
    }
    
    $.extend(messageToSend, message);
    this.state.websocket.send(JSON.stringify( messageToSend ));
    this.setState({ preservedTarget: {}, gameStateSpecial: 0 });    
  },
  
  sendActionWithTarget: function(target) {
    if(this.state.preservedTarget.hasOwnProperty('needed') && this.state.preservedTarget['needed'] ) {
      this.setState({ preservedTarget: target });
  
    }
    var id = this.state.targetMessage.hasOwnProperty('act') ? 5 : 7 // no act means it's a character
    $.extend( target, this.state.targetMessage );
    $.extend( target, this.buildMessage(id) );
    this.state.websocket.send(JSON.stringify( target )); 
    this.setState({ targetMessage: {}, needTarget: false });
  },
   
  sendContest: function(message) {
    $.extend( message, this.buildMessage(6) );
    this.state.websocket.send(JSON.stringify( message ));
    if( message['contest'] == 1) {
      this.setState(function (prevState, currProps) {
        prevState.entries.push({ 'private': true, 'message': "You will contest " + prevState.players[prevState.turn] + "'s claim!" });
        return { entries: prevState.entries };
      });
    }
    else {
      this.setState(function (prevState, currProps) {
        prevState.entries.push({ 'private': true, 'message': "You will not contest " + prevState.players[prevState.turn] + "'s claim!" });
        return { entries: prevState.entries };
      });
    }
  },
  
  sendChat: function(message) {
    $.extend( message, this.buildMessage(8));
    this.state.websocket.send(JSON.stringify( message ));
  },
  
  
  leaveLobby: function(e) {
    this.state.websocket.send(JSON.stringify( this.buildMessage(4) ));
  },
  // ----------------------------------------------------------------- getActionForTarget
  getActionForTarget(message) {
    this.setState({ targetMessage: message, needTarget: true })
  },
  
  getTargetOne(target) {
    this.setState( function (prevState, currProps) {
      prevState.multiTarget.push( target['target'] );
      return{ multiTarget: prevState.multiTarget };
    });
  },
  
  getTargetTwo(target) {
    this.setState( function (prevState, currProps) {
      prevState.multiTarget.push( target['target'] );
      return{ multiTarget: prevState.multiTarget };
    });
    this.setState({ needMultiTarget: false, needTarget: false, gameStateSpecial: 999 });
  },
  
  // --------------------------------------------------------------- Debug tools
  handleChange: function(e) {
    this.setState({ customMessage: e.target.value });
  },
  
  submitCustom: function(e) {
    e.preventDefault();
    this.state.websocket.send( this.state.customMessage );    
  },
  
  startGameWithFake: function(e) { 
    this.state.websocket.send(JSON.stringify( this.buildMessage(997) ));
  },

  // -------------------------------------------------------------------- render
  render: function render() {

    
    var targetSelectorFunction = this.sendActionWithTarget;
    if( this.state.needMultiTarget ) {
      if( this.state.multiTarget.length == 0 ) {
        targetSelectorFunction = this.getTargetOne;
      }
      else if (this.state.multiTarget.length == 1) {
        targetSelectorFunction = this.getTargetTwo;
      }
      else {
        targetSelectorFunction = null;
      }
    }
    
    return React.createElement(
      'div',
      { className: 'container game-area' },
      React.createElement(GameLog, { entries: this.state.entries,
                                     sendChat: this.sendChat }),
      React.createElement(GameArena, { 
        // parameters
        middle: this.state.middle,
        gameState: this.state.gameState,
        playerName: this.props.username,
        players: this.state.players,
        playerCards: this.state.playerCards,
        playerCoins: this.state.playerCoins,
        gameState: this.state.gameState,
        
        // things that affect what the user can do
        gameStateSpecial: this.state.gameStateSpecial,
        myTurn: this.state.myTurn,
        myCard: this.state.myCard,
        actions: this.state.actions,
        
        // things that affect the card area
        needTarget: this.state.needTarget,
        multiTarget: this.state.multiTarget,
        gameCards: this.state.gameCards,
        preservedTarget: this.state.preservedTarget,
        courtCoins: this.state.courtCoins,
        
        // functions
        sendAction: this.sendAction,
        getActionForTarget: this.getActionForTarget,
        sendActionWithTarget: targetSelectorFunction,
        sendContest: this.sendContest
      }),
      (this.state.host && this.state.gameState == 0) ? React.createElement(
        'a',
        { className:'btn btn-info', href: '#', onClick: this.startGame },
        'start game'
      ) : "",
      this.state.debug ? React.createElement(
        'a',
        { className:'btn btn-info', href: '#', onClick: this.startGameWithFake },
        'start game with 12 fake users'
      ) : "",
      React.createElement(
        'a',
        { className:'btn btn-info', href: this.state.hasWinner ? '/' : '#', onClick: this.leaveLobby },
        'Leave lobby'
      ),
      React.createElement(
        'br',
        {}
      ),
      this.state.debug ? React.createElement(
        'input',
        { onChange: this.handleChange }
      ) : "",
      this.state.debug ? React.createElement(
        'a',
        { className:'btn btn-default', href: '#', onClick: this.submitCustom },
        'submit custom message'
      ) : ""
    );
  }
});

// ------------------------------------------------------------------- GameArena
var GameArena = React.createClass({
  displayName: 'GameArena',

  render: function render() {

    var myCoins;
    var myCard = null
    for (var i = 0; i < this.props.players.length; i++) {
      if (this.props.players[i] == this.props.playerName) {
        myCoins = this.props.playerCoins[i];
        if( this.props.playerCards != null ) {
          myCard = this.props.playerCards[i] 
        }
      }
    }
    
    if( this.props.myCard > -1 ) {
      myCard = this.props.myCard;
    }
    
    return React.createElement(
      'div',
      { className: 'col-sm-9 game-arena' },
      React.createElement(CardArea, { players: this.props.players, 
        playerCoins: this.props.playerCoins,
        playerName: this.props.playerName,
        playerCards: this.props.playerCards,
        middle: this.props.middle,
        gameState: this.props.gameState,
        multiTarget: this.props.multiTarget,
        needTarget: this.props.needTarget,
        preservedTarget: this.props.preservedTarget,
        courtCoins: this.props.courtCoins,
        sendActionWithTarget: this.props.sendActionWithTarget }),
      React.createElement(ActionArea, { 
        gameCards: this.props.gameCards,
        myTurn: this.props.myTurn,
        gameState: this.props.gameState,
        gameStateSpecial: this.props.gameStateSpecial,
        actions: this.props.actions,
        myName: this.props.playerName,
        myCoins: myCoins,
        myCard: myCard,
        getActionForTarget: this.props.getActionForTarget,
        sendAction: this.props.sendAction,
        sendContest: this.props.sendContest })
    );
  }
});

// -------------------------------------------------------------------- CardArea
var CardArea = React.createClass({
  displayName: 'CardArea',

  render: function render() {
    var numOpponents = this.props.players.length - 1;

    var topOffset;
    var botOffset;

    switch (numOpponents) {
      case 3:
        topOffset = 3;
        botOffset = 4;
        break;
      case 4:
        topOffset = 2;
        botOffset = 5;
        break;
      case 5:
        topOffset = 3;
        botOffset = 4;
        break;
      default:
        topOffset = 6 - numOpponents / 2 + numOpponents % 2;
        botOffset = 6 - numOpponents / 2;
        break;
    }

    var j = 0; //count player index except self
    var topCards = [];
    var botCards = [];
    for (var i = 0; i < this.props.players.length; i++) {
      if (this.props.players[i] == this.props.playerName) {
        continue;
      } 
      
      var thisCard;
      if(this.props.preservedTarget.hasOwnProperty('target') && this.props.preservedTarget['target'] == this.props.players[i] && this.props.preservedTarget.hasOwnProperty('card')) {
        thisCard = this.props.preservedTarget['card'];
      }
      else {
        thisCard = this.props.playerCards[i];
      }
      if (j >= numOpponents / 2 || numOpponents <= 4) {
        topCards.push({ name: this.props.players[i],
                        coins: this.props.playerCoins[i],
                        card: thisCard,
                        index: this.props.players[i],
                        selected: (this.props.multiTarget.indexOf( this.props.players[i] ) > -1) });
        j++;
      }
      else {
        botCards.push({ name: this.props.players[i],
                        coins: this.props.playerCoins[i],
                        card: thisCard,
                        index: this.props.players[i],
                        selected: (this.props.multiTarget.indexOf( this.props.players[i] ) > -1) });
        j++;
      }
    }

    if (this.props.players.length < 6 && this.props.gameState != 0) {
      for( var j = 0 ; j < (6 - this.props.players.length) ; j++ ) {
        var thisCard;
        if(this.props.preservedTarget.hasOwnProperty('target') && this.props.preservedTarget['target'] == j && this.props.preservedTarget.hasOwnProperty('card')) {
          thisCard = this.props.preservedTarget['card'];
        }
        else {
          thisCard = this.props.playerCards[j + this.props.players.length];
        }
        botCards.push({ name: "middlecard" + j.toString(),
                        coins: -1,
                        card: thisCard,
                        index: j,
                        selected: (this.props.multiTarget.indexOf( j ) > -1) });
      
      }
      
    }
    
    return React.createElement(
      'div',
      { className: 'row card-area' },
      React.createElement(CardRow, { needTarget: this.props.needTarget, 
                                     sendActionWithTarget: this.props.sendActionWithTarget,
                                     offset: topOffset, 
                                     cards: topCards }),
      React.createElement(
        'span',
        {className: 'row court gold'},
        "Courthouse gold: " + this.props.courtCoins
      ),
      React.createElement(CardRow, { needTarget: this.props.needTarget, 
                                     sendActionWithTarget: this.props.sendActionWithTarget,
                                     offset: botOffset,
                                     cards: botCards })
    );
  }
});

// --------------------------------------------------------------------- CardRow
var CardRow = React.createClass({
  
  target: function(index) {
    if(this.props.needTarget) { 
      this.props.sendActionWithTarget( { target: index } ); 
    }
  },
  
  GameCard: [ 
    'judge',
    'bishop',
    'king',
    'fool',
    'queen',
    'theif',
    'witch',
    'spy',
    'peasant',
    'cheat',
    'inquisitor',
    'widow',
  ],

  displayName: 'CardRow',

  render: function render() {
    var cards = [];
    for (var i = 0; i < this.props.cards.length; i++) {
      var offset = (i == 0 && this.props.offset != 0 ) ? " col-sm-offset-" + this.props.offset.toString() : "";
      var cardFile = (this.props.cards[i]['card'] != null) ? this.GameCard[this.props.cards[i]['card']] : "cardBack";
      cards.push(React.createElement(
        'div',
        { className: "col-sm-2 col-xs-4 player" + offset + (this.props.needTarget ? " need-target" : "") + (this.props.cards[i]['selected'] ? " target-selected" : ""), onClick: (this.props.cards[i]['selected'] ? null : this.target.bind(this,this.props.cards[i]['index']) ) },
        React.createElement('img', { className: "player-card",
                                     src: "images/cardAssets/" + cardFile + ".png",
                                     }),
        React.createElement(
          'span',
          { className: 'username' },
          this.props.cards[i].name
        ),
        React.createElement(
          'span',
          { className: 'gold' },
          (this.props.cards[i].coins >= 0 ? ('Gold: ' + this.props.cards[i].coins) : "")
        )
      ));
    }
    return React.createElement(
      'div',
      { className: 'row card-row' },
      cards
    );
  }
});

// ------------------------------------------------------------------ ActionArea
var ActionArea = React.createClass({
    
  SWAP_CARD: 0,
  VIEW_OWN_CARD: 1,
  CLAIM_CHARACTER: 2,
  
  CHOOSE_CONTEST: 3,
  
  SPECIAL_SWAP: 999, // not a server side game state, start from 999 work down
  SPECIAL_BEING_INQUIRED: 998,
  SPECIAL_SWAP_NOT_READY: 997,
  SPECIAL_DONT_CONTEST: 996,
  
  GameCard: [ 
    'judge',
    'bishop',
    'king',
    'fool',
    'queen',
    'theif',
    'witch',
    'spy',
    'peasant',
    'cheat',
    'inquisitor',
    'widow',
  ],
  

  displayName: 'ActionArea',
  
  getInitialState: function() {
    return({ pickingClaim: false });
  },
  
  check: function(e) {
    e.preventDefault();
    if(this.props.myTurn) {
      this.props.sendAction({ act: this.VIEW_OWN_CARD });
    }
  },
  
  swap: function(e) {
    e.preventDefault();
    if(this.props.myTurn && this.props.gameStateSpecial != this.SPECIAL_SWAP ) {
      this.props.getActionForTarget({ act: this.SWAP_CARD, fake: false });
    }
    else if( this.props.gameStateSpecial == this.SPECIAL_SWAP ) {
      this.props.sendAction({ fake: 0 });
    }
  },
  
  fake: function(e) {
    e.preventDefault();
    if(this.props.myTurn && this.props.gameStateSpecial != this.SPECIAL_SWAP ){
      this.props.getActionForTarget({ act: this.SWAP_CARD, fake: true });
    }
    else if( this.props.gameStateSpecial == this.SPECIAL_SWAP ) {
      this.props.sendAction({ fake: 1 });
    }
  },
  
  claim: function(e) {
    e.preventDefault();
    if(this.props.myTurn){
      this.setState({ pickingClaim: true });
    }
  },
  
  sendClaim: function(characterID) {
    if( this.props.gameStateSpecial == this.SPECIAL_BEING_INQUIRED ) {
    
      this.props.sendAction({ guess: characterID });
    }
    else {
      
      this.props.sendAction({ act: this.CLAIM_CHARACTER , character: characterID });
      this.setState({ pickingClaim: false });
    }
  },
  
  cancelClaim: function() {
    this.setState({ pickingClaim: false });
  },
  
  contest: function(contest, e) {
    e.preventDefault();
    this.props.sendContest( {'contest': contest} );
  },
  
  spyChoice: function(choice, e) {
    e.preventDefault();
    this.props.sendAction({ fake: choice });
  },
  
  render: function render() {
    var cardFile = (this.props.myCard != null) ? this.GameCard[this.props.myCard] : "cardBack";
    var buttonsArea;
    
    if (this.props.gameState < 3 && !this.props.myTurn && this.props.gameStateSpecial == 0) {
      
      // hack to hide timer when it's not your turn or you don't have any actions to make
      $("#timer").css( 'display', 'none' );
      $("#timerText").css( 'display', 'none');
      
      buttonsArea = React.createElement(
                      'div',
                      { className: 'col-sm-8 buttons-area' },
                      React.createElement('img', { className: "col-sm-6 action-button",
                                                   src: "images/zipboys/checkPress.png" }),
                      React.createElement('img', { className: "col-sm-6 action-button",
                                                   src: "images/zipboys/swapPress.png" }),
                      React.createElement('img', { className: "col-sm-6 action-button",
                                                   src: "images/zipboys/claimPress.png" }),
                      React.createElement('img', { className: "col-sm-6 action-button",
                                                   src: "images/zipboys/fakePress.png" })
      );
    }
    
    else {
      
      $("#timer").css( 'display', 'initial' );
      $("#timerText").css( 'display', 'initial' );
      
    
      if (this.state.pickingClaim || this.props.gameStateSpecial == this.SPECIAL_BEING_INQUIRED ) {
        buttonsArea = React.createElement( ClaimArea, { sendClaim: this.sendClaim,
                                                        cancelClaim: (this.props.gameStateSpecial == this.SPECIAL_BEING_INQUIRED) ? null : this.cancelClaim,
                                                        gameCards: this.props.gameCards  });
      }
      
      else if (this.props.gameStateSpecial == this.SPECIAL_SWAP_NOT_READY) {
        buttonsArea = React.createElement(
                        'div',
                        { className: 'col-sm-8 buttons-area' },
                        React.createElement('img', { className: "col-sm-6 action-button",
                                                     src: "images/zipboys/swapPress.png",
                                                     onClick: null }),
                        React.createElement('img', { className: "col-sm-6 action-button",
                                                     src: "images/zipboys/fakePress.png",
                                                     onClick: null })
                        );
      }      
      
      else if (this.props.gameStateSpecial == this.SPECIAL_SWAP) {
        buttonsArea = React.createElement(
                        'div',
                        { className: 'col-sm-8 buttons-area' },
                        React.createElement('img', { className: "col-sm-6 action-button available",
                                                     src: "images/zipboys/swap.png",
                                                     onClick: this.swap }),
                        React.createElement('img', { className: "col-sm-6 action-button available",
                                                     src: "images/zipboys/fake.png",
                                                     onClick: this.fake })
                        );
      }  
      
      else if (this.props.gameState == this.CHOOSE_CONTEST && this.props.gameStateSpecial != this.SPECIAL_DONT_CONTEST ) {
        buttonsArea = React.createElement(
                        'div',
                        { className: 'col-sm-8 buttons-area' },
                        React.createElement('img', { className: "col-sm-6 action-button",
                                                     src: "images/zipboys/contest.png",
                                                     onClick: this.contest.bind(this, 1) }),
                        React.createElement('img', { className: "col-sm-6 action-button",
                                                     src: "images/zipboys/nocontest.png",
                                                     onClick: this.contest.bind(this, 0) })
                        );
      }
      
      else {
        
        var canClaim = ( this.props.myTurn && ((this.CLAIM_CHARACTER & this.props.actions ) != 0));
        var canCheck = ( this.props.myTurn && ((this.VIEW_OWN_CARD & this.props.actions ) != 0));
        var canSwap = this.props.myTurn;
        
        buttonsArea = React.createElement(
                        'div',
                        { className: 'col-sm-8 buttons-area' },
                        React.createElement('img', { className: "col-sm-6 action-button" + (canCheck ? " available" : ""),
                                                     src: "images/zipboys/check" + (canCheck ? "" : "Press") + ".png",
                                                     onClick: this.check }),
                        React.createElement('img', { className: "col-sm-6 action-button" + (canSwap ? " available" : ""),
                                                     src: "images/zipboys/swap" + (canSwap ? "" : "Press") + ".png",
                                                     onClick: this.swap }),
                        React.createElement('img', { className: "col-sm-6 action-button" + (canClaim ? " available" : ""), 
                                                     src: "images/zipboys/claim" + (canClaim ? "" : "Press") + ".png",
                                                     onClick: this.claim }),
                        React.createElement('img', { className: "col-sm-6 action-button" + (canSwap ? " available" : ""),
                                                     src: "images/zipboys/fake" + (canSwap ? "" : "Press") + ".png",
                                                     onClick: this.fake })
        );
      }
    }
    
    return React.createElement(
      'div',
      { className: 'row action-area' },
      React.createElement(
        'div',
        { className: 'col-sm-4 my-card-area' },
        React.createElement(
          'span',
          { className: 'username' },
          'MY CARD'
        ),
        React.createElement('img', { className: 'my-card', src: "images/cardAssets/" + cardFile + ".png" }),
        React.createElement(
          'span',
          { className: 'username my-username' },
          this.props.myName
        ),
        React.createElement(
          'span',
          { className: 'gold my-gold' },
          (this.props.myCoins == undefined) ? "" : "Gold: " + this.props.myCoins
        )
      ),
      buttonsArea,
      React.createElement(
        'span',
        { id: 'timer' },
        '25'
      ),
      React.createElement(
        'span',
        { id: 'timerText' },
        'seconds left!'
      )
    );
  }
});

// --------------------------------------------------------------------- GameLog
var GameLog = React.createClass({
  displayName: 'GameLog',
  
  getInitialState: function() {
    return { text: "" };
  },
  
  submitMessageEnter: function(e) {
    if (e.keyCode == 13) {
    if( this.state.text != "" ) {
      this.props.sendChat( { text: this.state.text } );
      this.setState({ text: "" });
    }
    }
  },
  
  submitMessage: function(e) {
    e.preventDefault();
    if( this.state.text != "" ) {
      this.props.sendChat( { text: this.state.text } );
      this.setState({ text: "" });
    }
  },
  
  collectText: function(e) {
    this.setState({ text: e.target.value });
  },

  render: function render() {

    var entries = [];
    var logID = 0;
    var prevEntry = "";
    for (var entry in this.props.entries) {
      
      if (prevEntry == this.props.entries[entry]['message']) {
        // skip duplicate messages
        continue;
      }
      prevEntry = this.props.entries[entry]["message"];
      var individual = this.props.entries[entry]["private"];
      var chat = this.props.entries[entry].hasOwnProperty('chat');
      entries.push(React.createElement(
        'li',
        { className: "entry" + (individual ? " private" : "") + (chat ? " chat" : ""), key: "entry_" + logID.toString() },
        prevEntry
      ));
      
      logID++;
    }
    
    var textBox = React.createElement(
                    'input',
                    { onChange: this.collectText, id: 'chatbox', value: this.state.text, onKeyDown: this.submitMessageEnter }
                    );
   
    return React.createElement(
      'div',
      { className: 'col-sm-3' },
      React.createElement(
        'div',
        { className: 'game-log' },
        React.createElement(
          'ul',
          { className: 'log-entries' },
          entries
        )
      ),
      textBox,
      React.createElement(
        'a',
        { onClick: this.submitMessage, className: 'btn btn-default', id: 'chat-send' },
        'Send chat'
      )      
    );
  }
});

// ------------------------------------------------------------ Helper Functions

var CHARACTERS = [
    'judge',
    'bishop',
    'king',
    'fool',
    'queen',
    'theif',
    'witch',
    'spy',
    'peasant',
    'cheat',
    'inquisitor',
    'widow'
]

function url(port, id) {
  var l = window.location;
  return (l.protocol === "https:" ? "wss://" : "ws://") + l.hostname + (l.port != 80 && l.port != 443 ? ":" + port : "") + "/" + id;
}

function findMyCard( players, cards, me ) {
  var card = null;
  for( var i = 0 ; i < players.length ; i++ ) {
    if( players[i] == me ) {
      card = cards[i];
    }
  }    
}

function startTimer(duration) {
  console.log("30s timer starting now!");
    var display = $("#timer");
    $("#timerText").text = " seconds left!";
    var timer = duration, minutes, seconds;
    var interval = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.text( seconds );

        if (--timer < 0) {
            timer = 0;
        }
    }, 1000);
    return interval;
}



$(document).ready(function () {
  ReactDOM.render(React.createElement(Box, { 'username': USERNAME, 'token': TOKEN }), document.getElementById('react-area'));
});

