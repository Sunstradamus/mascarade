'use strict';

var Box = React.createClass({
  
  // store basically all state in Box, pass to children as props
  
  displayName: 'Box',

  // ----------------------------------------------------------- getDefaultProps
  getDefaultProps: function getDefaultProps() {
    return { username: 'user' };
  },
  
  // ----------------------------------------------------------- getInitialState
  getInitialState: function getInitialState() {
    return {
      token: this.props.token,
      players: [],
      playerCards: [],
      playerCoins:[],
      entries: [],
      gameState: 0,
      myTurn: false,
      needTarget: false,
      middle: [],
      actions: 0,
      gameCards: [],
      gameStateSpecial: 0,
      myCard: -1,
      revealedCards: {},
      needMultiTarget: false,
      multiTarget: [],
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
    window.location.href = '/';
  },

  onError: function onError(e) {
    console.log(e.data);
  },

  onMessage: function onMessage(e) {
    console.log(e.data);
    var msg = JSON.parse(e.data);
    
    if(!msg.hasOwnProperty('id')) {
      if(msg.hasOwnProperty('card')) {
        this.setState(function (prevState, currProps) {
          prevState.entries.push({ 'private': true, 'message': "Your card is the " + this.CHARACTERS[msg['card']] });
          return { entries: prevState.entries };
        });
      }
      
      else {
      
        var cards = [];
        if( msg.hasOwnProperty('revealedCards')) {
          cards = msg['revealedCards'];
        } 
        else if( msg.hasOwnProperty('playerCards')) {
          cards = msg['playerCards'];
        }
      
        this.setState({ 
          gameState: msg['state'],
          gameCards: msg.hasOwnProperty('playerCards') ? msg['playerCards'] : this.state.gameCards,
          playerCards: cards,
          players: msg.hasOwnProperty('players') ? msg['players'] : this.state.players,
          playerCoins: msg.hasOwnProperty('playerCoins') ? msg['playerCoins'] : this.state.playerCoins,
          middle: msg.hasOwnProperty('middle') ? msg['middle'] : [],
          turn: msg.hasOwnProperty('turn') ? msg['turn'] : this.state.turn,
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
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': true, 'message': "Connected to game lobby" });
            return { entries: prevState.entries };
          });
          this.setState({ auth: msg['auth'] });
          break;
        case 5:
          // Turn notification & actions permitted
          this.setState(function (prevState, currProps) {
            prevState.entries.push({ 'private': true, 'message': "It's your turn!" });
            return { entries: prevState.entries, myTurn: true, actions: msg['actions'] };
          });
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
            prevState.entries.push({ 'private': false, 'message': prevState.players[prevState.turn] + " might have swapped with " + msg['target'] });
            return { entries: prevState.entries };
          });
          break;
        case 201:
          // Player has looked at their own cards
          console.log(this.state.players);
          console.log(this.state.turn);
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
            return { entries: prevState.entries, myCard: msg['card'], needTarget: true, targetMessage: {}, preservedTarget: { needed: true } };
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
            prevState.entries.push({ 'private': false, 'message': prevState.players[msg['target']] + " and " + prevState.players[msg['other']] + " might have had their cards swapped!" });
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
    return({ id: id, username: this.props.username, auth: this.state.auth, token: this.state.token });
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
    var id = this.state.targetMessage.hasOwnProperty('act') ? 5 : 7 // no act means it's a character
    var messageToSend = this.buildMessage(id);
    
    if(this.state.GAME_STATE_SPECIAL == 996) { // special stuff for fool
      messageToSend['target'] = this.state.multiTarget[0];
      messageToSend['other'] = this.state.multiTarget[1];
      this.setState({ needMultiTarget: false, needTarget: false, multiTarget: [] });
    }
    
    $.extend(messageToSend, message);
    console.log("Sending...");
    console.log(messageToSend );
    this.state.websocket.send(JSON.stringify( messageToSend ));
    this.setState({ preservedTarget: {}, gameStateSpecial: 0 });    
  },
  
  sendActionWithTarget: function(target) {
    if(this.state.preservedTarget.hasOwnProperty('needed') && this.state.preservedTarget['needed']) {
      this.setState({ preservedTarget: { target: target } });
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
    console.log(message);
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
  
  
  leaveLobby: function(e) {
    this.state.websocket.send(JSON.stringify( this.buildMessage(4) ));
  },
  // ----------------------------------------------------------------- getActionForTarget
  getActionForTarget(message) {
    this.setState({ targetMessage: message, needTarget: true })
  },
  
  getTargetOne(target) {
    this.setState( function (prevState, currProps) {
      prevState.multiTarget.push( target );
      return{ multiTarget: prevState.multiTarget };
    });
  },
  
  getTargetTwo(target) {
    this.setState( function (prevState, currProps) {
      prevState.multiTarget.push( target );
      return{ multiTarget: prevState.multiTarget };
    });
    this.setState({ needMultiTarget: false, needTarget: false, gameStateSpecial: 996 });
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
        multiTarget: this.state.multiTarget,
        actions: this.state.actions,
        gameCards: this.state.gameCards,
        preservedTarget: this.state.multiTarget,
        
        // functions
        sendAction: this.sendAction,
        getActionForTarget: this.getActionForTarget,
        sendActionWithTarget: targetSelectorFunction,
        sendContest: this.sendContest
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
        'a',
        { className:'btn btn-info', href: '#', onClick: this.leaveLobby },
        'Leave lobby'
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
        sendActionWithTarget: this.props.sendActionWithTarget }),
      React.createElement(ActionArea, { 
        gameCards: this.props.gameCards,
        myTurn: this.props.myTurn,
        gameState: this.props.gameState,
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
      } else if (j >= numOpponents / 2 || numOpponents <= 4) {
        var thisCard;
        if(this.props.preservedTarget.hasOwnProperty('target') && this.props.preservedTarget['target'] == this.props.players[i] && this.props.preservedTarget.hasOwnProperty('card')) {
          thisCard = this.props.preservedTarget['card'];
        }
        else {
          thisCard = this.props.playerCards[i];
        }
        topCards.push({ name: this.props.players[i],
                        coins: this.props.playerCoins[i],
                        card: thisCard,
                        index: this.props.players[i],
                        selected: (this.props.multiTarget.indexOf( this.props.players[i] ) > -1) });
        j++;
      } else {
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
          thisCard = this.props.middle[j];
        }
        botCards.push({ name: "middlecard" + j.toString(),
                        coins: 0,
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
      var cardFile = (this.props.cards[i].card != null) ? this.GameCard[this.props.cards[i]['card']] : "cardBack";
      cards.push(React.createElement(
        'div',
        { className: "col-sm-2 col-xs-3 player" + offset, onClick: (this.props.cards[i]['selected'] ? null : this.target.bind(this,this.props.cards[i]['index']) ) },
        React.createElement('img', { className: "player-card" + (this.props.needTarget ? " need-target" : "") + (this.props.cards[i]['selected'] ? " target-selected" : ""),
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
  
  CHOOSE_CONTEST: 3,
  
  SPECIAL_CHOOSE_SWAP: 999, // not a server side game state, start from 999 work down
  SPECIAL_BEING_INQUIRED: 998,
  SPECIAL_FOOL_NOT_READY: 997,
  SPECIAL_FOOL_READY: 996,
  
  // TODO: stop having this defined in like 3 places
  
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
    if(this.props.myTurn && this.props.GAME_STATE_SPECIAL != this.SPECIAL_FOOL_READY ) {
      this.props.getActionForTarget({ act: this.SWAP_CARD, fake: false });
    }
    else if( this.props.GAME_STATE_SPECIAL == this.SPECIAL_FOOL_READY ) {
      this.props.sendAction({ fake: 0 });
    }
  },
  
  fake: function(e) {
    e.preventDefault();
    if(this.props.myTurn && this.props.GAME_STATE_SPECIAL != this.SPECIAL_FOOL_READY ){
      this.props.getActionForTarget({ act: this.SWAP_CARD, fake: true });
    }
    else if( this.props.GAME_STATE_SPECIAL == this.SPECIAL_FOOL_READY ) {
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
    
    if (this.state.pickingClaim || this.props.gameStateSpecial == this.SPECIAL_BEING_INQUIRED ) {
      buttonsArea = React.createElement( ClaimArea, { sendClaim: this.sendClaim,
                                                      cancelClaim: (this.props.gameStateSpecial == this.SPECIAL_BEING_INQUIRED) ? null : this.cancelClaim,
                                                      gameCards: this.props.gameCards  });
    }
    
    else if (this.props.gameStateSpecial == this.SPECIAL_CHOOSE_SWAP) {
      buttonsArea = React.createElement(
                      'div',
                      { className: 'col-sm-8 buttons-area' },
                      React.createElement('img', { className: "col-sm-6 action-button",
                                                   src: "images/zipboys/swap.png",
                                                   onClick: this.contest.bind(this, 0) }),
                      React.createElement('img', { className: "col-sm-6 action-button",
                                                   src: "images/zipboys/fake.png",
                                                   onClick: this.contest.bind(this, 1) })
                      );
    }   

    else if (this.props.gameStateSpecial == this.SPECIAL_FOOL_NOT_READY) {
      buttonsArea = React.createElement(
                      'div',
                      { className: 'col-sm-8 buttons-area' },
                      React.createElement('img', { className: "col-sm-6 action-button",
                                                   src: "images/zipboys/swapPressed.png",
                                                   onClick: null }),
                      React.createElement('img', { className: "col-sm-6 action-button",
                                                   src: "images/zipboys/fakePressed.png",
                                                   onClick: null })
                      );
    }      
    
    else if (this.props.gameStateSpecial == this.SPECIAL_FOOL_READY) {
      buttonsArea = React.createElement(
                      'div',
                      { className: 'col-sm-8 buttons-area' },
                      React.createElement('img', { className: "col-sm-6 action-button",
                                                   src: "images/zipboys/swap.png",
                                                   onClick: this.swap }),
                      React.createElement('img', { className: "col-sm-6 action-button",
                                                   src: "images/zipboys/fake.png",
                                                   onClick: this.fake })
                      );
    }  
    
    else if (this.props.gameState == this.CHOOSE_CONTEST ) {
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
  ReactDOM.render(React.createElement(Box, { 'username': USERNAME, 'token': TOKEN }), document.getElementById('react-area'));
});

