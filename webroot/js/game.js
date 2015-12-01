'use strict';

var Box = React.createClass({
  displayName: 'Box',

  getDefaultProps: function getDefaultProps() {
    return { username: 'user', token: 'lool' };
  },

  getInitialState: function getInitialState() {
    return { players: {},
      playerCards: {},
      playerCoins: {},
      entries: []
    };
  },

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
        console.log("it's your turn");
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

    }
  },
  
  startGame: function() {
    this.state.websocket.send(JSON.stringify({ id: 3, username: this.props.username, token: this.props.token, auth: this.state.auth }));
  },
  
  handleChange: function(e) {
    this.setState({ customMessage: e.target.value });
  },
  
  submitCustom: function(e) {
    e.preventDefault();
    this.state.websocket.send( this.state.customMessage );    
  },

  render: function render() {
    return React.createElement(
      'div',
      { className: 'container game-area' },
      React.createElement(GameLog, { entries: this.state.entries }),
      React.createElement(GameArena, { playerName: this.props.username,
        players: this.state.players,
        playerCards: this.state.playerCards,
        coins: this.state.playerCoins }),
      React.createElement(
        'a',
        { className:'btn btn-info', href: '#', onClick: this.startGame },
        'start game'
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

var GameLog = React.createClass({
  displayName: 'GameLog',

  render: function render() {

    var entries = [];
    var logID = 0;
    for (var entry in this.props.entries) {
      var individual = entry.hasOwnProperty("private") && entry["private"];
      entries.push(React.createElement(
        'li',
        { className: individual ? "private entry" : "private", key: "entry_" + logID.toString() },
        this.props.entries[entry]["message"]
      ));
      logID++;
    }
    
    console.log(entries);

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

var GameArena = React.createClass({
  displayName: 'GameArena',

  render: function render() {

    var myCoins;
    for (var i = 0; i < this.props.players.length; i++) {
      if (this.props.players[i] == this.props.playerName) {
        myCoins = this.props.playerCoins[i];
      }
    }

    return React.createElement(
      'div',
      { className: 'col-sm-9 game-arena' },
      React.createElement(CardArea, { players: this.props.players, playerCoins: this.props.playerCoins }),
      React.createElement(ActionArea, { myName: this.props.playerName, myCoins: myCoins })
    );
  }
});

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
        topCards.push({ name: this.props.players[i], coins: this.props.playerCoins[i] });
        j++;
      } else {
        botCards.push({ name: this.props.players[i], coins: this.props.playerCoins[i] });
        j++;
      }
    }

    return React.createElement(
      'div',
      { className: 'row card-area' },
      React.createElement(CardRow, { offset: topOffset, cards: topCards }),
      React.createElement(CardRow, { offset: botOffset, cards: botCards })
    );
  }
});

var CardRow = React.createClass({
  displayName: 'CardRow',

  render: function render() {
    var cards = [];
    for (var i = 0; i < this.props.cards.length; i++) {

      var offset = i == 1 && this.props.offset != 0 ? " offset-" + offset.toString() : "";
      cards.push(React.createElement(
        'div',
        { className: "col-sm-2 col-xs-3 player" + offset },
        React.createElement('img', { 'class': 'player-card', src: 'images/cardAssets/cardBack.png' }),
        React.createElement(
          'span',
          { 'class': 'username' },
          cards[i].name
        ),
        React.createElement(
          'span',
          { 'class': 'gold' },
          'Gold: ' + cards[i].coins
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

var ActionArea = React.createClass({
  displayName: 'ActionArea',

  //TODO
  render: function render() {
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
        React.createElement('img', { className: 'my-card', src: 'images/cardAssets/cardBack.png' }),
        React.createElement(
          'span',
          { className: 'username my-username' },
          this.props.myName
        ),
        React.createElement(
          'span',
          { className: 'gold my-gold' },
          'Gold: 9'
        )
      ),
      React.createElement(
        'div',
        { className: 'col-sm-8 buttons-area' },
        React.createElement('img', { className: 'col-sm-6 action-button', src: 'images/zipboys/check.png' }),
        React.createElement('img', { className: 'col-sm-6 action-button', src: 'images/zipboys/swap.png' }),
        React.createElement('img', { className: 'col-sm-6 action-button', src: 'images/zipboys/claim.png' }),
        React.createElement('img', { className: 'col-sm-6 action-button', src: 'images/zipboys/fake.png' })
      )
    );
  }
});

function url(port, id) {
  var l = window.location;
  return (l.protocol === "https:" ? "wss://" : "ws://") + l.hostname + (l.port != 80 && l.port != 443 ? ":" + port : "") + "/" + id;
}

$(document).ready(function () {
  ReactDOM.render(React.createElement(Box, { 'username': 'landon' }), document.getElementById('react-area'));
});