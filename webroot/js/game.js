'use strict';

var Box = React.createClass({
  
  // store basically all state in Box, pass to children as props
  
  displayName: 'Box',

  // ----------------------------------------------------------- getDefaultProps
  getDefaultProps: function getDefaultProps() {
    return { username: 'user', token: 'lool' };
  },
  
  // ----------------------------------------------------------- getInitialState
  getInitialState: function getInitialState() {
    return {
      players: [],
      playerCards: [],
      playerCoins:[],
      entries: [],
      gameState: 0,
      myTurn: false,
      needTarget: false,
      middle: []
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

  // ----------------------------------------------------------- socketCallbacks
  onOpen: function onOpen(e) {
    console.log("websocket opened");
  },

  onClose: function onClose(e) {
    console.log("websocket closed");
  },

  onError: function onError(e) {
    console.log(e.data);
  },

  onMessage: function onMessage(e) {
    console.log(e.data);
    var msg = JSON.parse(e.data);
    
    if(!msg.hasOwnProperty('id')) {
      
      this.setState({ 
        gameState: msg['state'],
        playerCards: msg.hasOwnProperty('playerCards') ? msg['playerCards'] : [],
        players: msg.hasOwnProperty('players') ? msg['players'] : this.state.players,
        playerCoins: msg.hasOwnProperty('playerCoins') ? msg['playerCoins'] : this.state.playerCoins,
        middle: msg.hasOwnProperty('middle') ? msg['middle'] : [],
        turn: msg['turn'],
      });
    }
    else {
      
      switch (msg['id']) {
        case 1:
          console.log('authentication requested');
          // Authentication requested     
          this.state.websocket.send(JSON.stringify({ id: 1, username: this.props.username, token: this.props.token }));
          break;
        case 2:
          // Authentication approved
          console.log("authentication approved");
          this.setState({ auth: msg['auth'] });
          break;
        case 5:
          // Turn notification & actions permitted
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': true, 'message': "It's your turn!" });
            return { entries: prevState.entries, myTurn: true };
          });
          break;
        case 100:
          // Regenerated authentication key
          auth = msg['auth'];
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
            return { entries: prevState.entries };
          });
          break;
        case 105:
          // Game Over, multiple winners
          this.setState(function (prevState, currProps) {
            var winners = []
            for( var i = 0 ; i < msg['players'].length ; i++) {
              winners.push( prevState.players[msg['players']]);
            }
            prevState.entries.push({ 'private': false, 'message': "Game Over! " + winners.join(', ') + " win!" });
            return { entries: prevState.entries };
          });
          break;
        case 200:
          // Player has swapped or not with target player
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': false, 'message': prevState.players[prevState.turn] + " might've swapped with " + msg['target'] });
            return { entries: prevState.entries };
          });
          break;
        case 201:
          // Player has looked at their own card
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': false, 'message': prevState.players[prevState.turn] + " checked their card" });
            return { entries: prevState.entries };
          });
          break;
        case 202:
          // Player has claimed a character
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': false, 'message': prevState.players[prevState.turn] + " is claiming " + CHARACTERS[msg['claimed']] });
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
    return({ id: id, username: this.props.username, auth: this.state.auth, token: this.props.token });
  },
  
  
  // ------------------------------------------ Different actions to send server
  startGame: function(e) { 
    var messageToSend = this.buildMessage(3);
    this.state.websocket.send( JSON.stringify( messageToSend ));
  },

  startGameWithFake: function(e) { 
    this.state.websocket.send(JSON.stringify( this.buildMessage(997) ));
  },
  
  sendAction: function(message) {
    var messageToSend = this.buildMessage(5);
    $.extend(messageToSend, message);
    this.state.websocket.send(JSON.stringify( messageToSend ));    
  },
  
  sendActionWithTarget: function(target) {
    $.extend( target, this.state.targetMessage );
    $.extend( target, this.buildMessage(5) );
    console.log(target);
    this.state.websocket.send(JSON.stringify( target )); 
    this.setState({ targetMessage: {}, needTarget: false });
  },
  
  // ----------------------------------------------------------------- getActionForTarget
  getActionForTarget(message) {
    this.setState({ targetMessage: message, needTarget: true })
  },
  
  // --------------------------------------------------------------- Debug tools
  handleChange: function(e) {
    this.setState({ customMessage: e.target.value });
  },
  
  submitCustom: function(e) {
    e.preventDefault();
    this.state.websocket.send( this.state.customMessage );    
  },

  // -------------------------------------------------------------------- render
  render: function render() {
    console.log(this.state.needTarget);
    return React.createElement(
      'div',
      { className: 'container game-area' },
      React.createElement(GameLog, { entries: this.state.entries }),
      React.createElement(GameArena, { 
        // parameters
        middle: this.state.middle,
        gameState: this.state.gameState,
        playerName: this.props.username,
        players: this.state.players,
        playerCards: this.state.playerCards,
        playerCoins: this.state.playerCoins,
        gameState: this.state.gameState,
        myTurn: this.state.myTurn,
        needTarget: this.state.needTarget,
        
        // functions
        sendAction: this.sendAction,
        getActionForTarget: this.getActionForTarget,
        sendActionWithTarget: this.sendActionWithTarget
      }),
      React.createElement(
        'a',
        { className:'btn btn-info', href: '#', onClick: this.startGame },
        'start game'
      ),
      React.createElement(
        'a',
        { className:'btn btn-info', href: '#', onClick: this.startGameWithFake },
        'start game with fake'
      ),
      React.createElement(
        'br',
        {}
      ),
      React.createElement(
        'input',
        { onChange: this.handleChange }
      ),
      React.createElement(
        'a',
        { className:'btn btn-default', href: '#', onClick: this.submitCustom },
        'submit custom message'
      )
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
    
    return React.createElement(
      'div',
      { className: 'col-sm-9 game-arena' },
      React.createElement(CardArea, { players: this.props.players, 
        playerCoins: this.props.playerCoins,
        playerName: this.props.playerName,
        playerCards: this.props.playerCards,
        middle: this.props.middle,
        gameState: this.props.gameState,
        needTarget: this.props.needTarget,
        sendActionWithTarget: this.props.sendActionWithTarget }),
      React.createElement(ActionArea, { 
        myName: this.props.playerName,
        myCoins: myCoins,
        myCard: myCard,
        getActionForTarget: this.props.getActionForTarget,
        sendAction: this.props.sendAction })
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
      } else if (j >= numOpponents / 2 || numOpponents <= 4) {
        topCards.push({ name: this.props.players[i],
                        coins: this.props.playerCoins[i],
                        card: this.props.playerCards[i],
                        index: this.props.players[i] });
        j++;
      } else {
        botCards.push({ name: this.props.players[i],
                        coins: this.props.playerCoins[i],
                        card: this.props.playerCards[i],
                        index: this.props.players[i] });
        j++;
      }
    }

    if (this.props.players.length < 6 && this.props.gameState != 0) {
      for( var j = 0 ; j < (6 - this.props.players.length) ; j++ ) {
        botCards.push({ name: "middlecard" + j.toString(),
                        coins: 0,
                        card: this.props.middle[j],
                        index: j});
      
      }
      
    }
    
    return React.createElement(
      'div',
      { className: 'row card-area' },
      React.createElement(CardRow, { needTarget: this.props.needTarget, 
                                     sendActionWithTarget: this.props.sendActionWithTarget,
                                     offset: topOffset, 
                                     cards: topCards }),
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
      var cardFile = (this.props.card != null) ? GameCard[this.props.cards[i]['card']] : "cardBack";
      cards.push(React.createElement(
        'div',
        { className: "col-sm-2 col-xs-3 player" + offset, onClick: this.target.bind(this,this.props.cards[i]['index']) },
        React.createElement('img', { className: "player-card" + (this.props.needTarget ? " need-target" : ""),
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
          'Gold: ' + this.props.cards[i].coins
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
    e.preventDefault()
    this.props.sendAction({ act: this.VIEW_OWN_CARD });
  },
  
  swap: function(e) {
    e.preventDefault()
    this.props.getActionForTarget({ act: this.SWAP_CARD, fake: false });
  },
  
  fake: function(e) {
    e.preventDefault()
    this.props.getActionForTarget({ act: this.SWAP_CARD, fake: true });
  },
  
  claim: function(e) {
    this.setState({ pickingClaim: true });
  },
  
  sendClaim: function(characterID) {
    this.props.sendAction({ act: this.claim, character: characterID });
    this.setState({ pickingClaim: false });
  },
  
  cancelClaim: function() {
    this.setState({ pickingClaim: false });
  },
  
  render: function render() {
    
    var cardFile = (this.props.card != null) ? GameCard[this.props.card] : "cardBack";
    var buttonsArea;
    
    if (this.state.pickingClaim) {
      buttonsArea = React.createElement( ClaimArea, { sendClaim: this.sendClaim,
                                                      cancelClaim: this.cancelClaim });
    }
    
    else {
      buttonsArea = React.createElement(
                      'div',
                      { className: 'col-sm-8 buttons-area' },
                      React.createElement('img', { className: 'col-sm-6 action-button',
                                                   src: 'images/zipboys/check.png',
                                                   onClick: this.check }),
                      React.createElement('img', { className: 'col-sm-6 action-button', 
                                                   src: 'images/zipboys/swap.png',
                                                   onClick: this.swap }),
                      React.createElement('img', { className: 'col-sm-6 action-button', 
                                                   src: 'images/zipboys/claim.png',
                                                   onClick: this.claim }),
                      React.createElement('img', { className: 'col-sm-6 action-button', 
                                                   src: 'images/zipboys/fake.png',
                                                   onClick: this.fake }),
                      React.createElement('span', { id: 'timer' })
      );
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
          this.props.myCoins
        )
      ),
      buttonsArea
    );
  }
});

// --------------------------------------------------------------------- GameLog
var GameLog = React.createClass({
  displayName: 'GameLog',

  render: function render() {

    var entries = [];
    var logID = 0;
    for (var entry in this.props.entries) {
      var individual = this.props.entries[entry]["private"];
      entries.push(React.createElement(
        'li',
        { className: individual ? "private entry" : "entry", key: "entry_" + logID.toString() },
        this.props.entries[entry]["message"]
      ));
      logID++;
    }
    
    return React.createElement(
      'div',
      { className: 'col-sm-3 hidden-xs' },
      React.createElement(
        'div',
        { className: 'game-log' },
        React.createElement(
          'ul',
          { className: 'log-entries' },
          entries
        )
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
    var display = $("timer");
    var timer = duration, minutes, seconds;
    setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.text(minutes + ":" + seconds);

        if (--timer < 0) {
            timer = duration;
        }
    }, 1000);
}

$(document).ready(function () {
  ReactDOM.render(React.createElement(Box, { 'username': 'landon' }), document.getElementById('react-area'));
});