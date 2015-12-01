var Box = React.createClass({
  
  getDefaultProps: function() {
    return( { username: 'user' } ); 
  },
  
  getInitialState: function() {
    return( { players: {},
              playerCards: {},
              playerCoins: {},
              entries: {} 
            }
    );
  },
  
  componentDidMount: function() {
    var params = location.search.split('&port=');
    var port = params[1];
    var lobbyID = params[0].split('lobby=')[1];
    
    var socketURL = url(port, lobbyID);
    var websocket = new WebSocket(socketURL); 
    websocket.addEventListener('open', this.onOpen );
    websocket.addEventListener('close', this.onClose );
    websocket.addEventListener('message', this.onMessage );
    websocket.addEventListener('error', this.onError );
    this.setState({ websocket: websocket });
  },
  
  onOpen: function(e) {
    console.log("websocket opened");
  },
  
  onClose: function(e) {
    console.log("websocket closed");
  },
  
  onError: function(e) {
    console.log(e.data);
  },
  
  onMessage: function(e) {
    console.log(e.data);
    var msg = JSON.parse(e.data);
    switch(msg['id']) {
      case 1:
        // Authentication requested
        this.state.websocket.send(JSON.stringify( { id:1, username: this.props.username, token: this.props.token } ) );
        break;
      case 2:
        // Authentication approved
        console.log("authentication approved");
        auth = msg['auth'];
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
        this.setState( function( prevState, currProps ) {
          prevState.entries.push( { 'private': true, 'message': 'Insufficient users to start game' } );
          return( { entries: prevState.entries } );
        });
        break;
      
    }
  },
  
  render: function() {     
    return( 
      <div className="container game-area">
        <GameLog entries={this.state.entries}/>
        <GameArena playerName={this.props.username} 
		           players={this.state.players} 
				   playerCards={this.state.playerCards}
				   coins={this.state.playerCoins} />
        <a href="#" onClick={this.startGame}>"start game"</a>
      </div>
    );
  }
});

var GameLog = React.createClass({
  render: function() {
    
    var entries = [];
    for( var entry in this.props.entries ) {
      var individual = entry.hasOwnProperty("private") && entry["private"];
      entries.push( <li className={individual ? "private entry" : "private"}>
                      {entry["message"]}
                    </li>
      );  
    }
    
    return(
      <div className="col-sm-3 hidden-xs">
        <div className="game-log">
          <ul className="log-entries">
            {entries}
          </ul>
        </div>
      </div>
    );
  }
});

var GameArena = React.createClass({
  render: function() {
	  
	var myCoins
	for( var i = 0 ; i < this.props.players.length ; i++ ) {
	  if( this.props.players[i] == this.props.playerName ) {
		myCoins = this.props.playerCoins[i];
	  }
	}  
	  
    return( <div className="col-sm-9 game-arena">
              <CardArea players={this.props.players} playerCoins={this.props.playerCoins} />
              <ActionArea myName={this.props.playerName} myCoins={myCoins} />
            </div>
    );
  }
});

var CardArea = React.createClass({
  render: function() {
    var numOpponents = this.props.players.length - 1;
    
    var topOffset;
    var botOffset;
    
    switch(numOpponents)  {
    case(3):
      topOffset = 3;
      botOffset = 4;
      break;
    case(4):
      topOffset = 2;
      botOffset = 5;
      break;
    case(5):
      topOffset = 3;
      botOffset = 4;
      break;
    default:
      topOffset = 6 - (numOpponents/2) + (numOpponents % 2);
      botOffset = 6 - (numOpponents/2);
      break;
    }
    
    var j = 0;  //count player index except self
    var topCards = [];
    var botCards = [];
    for( var i = 0 ; i < this.props.players.length ; i++ ) {
      if( this.props.players[i] == this.props.playerName ) {
        continue;
      }
      else if (j >= numOpponents/2 || numOpponents <= 4) {
        topCards.push( {name: this.props.players[i], coins: this.props.playerCoins[i]});
        j++;
      }
      else{
        botCards.push( {name: this.props.players[i], coins: this.props.playerCoins[i]});
        j++;
      }    
    } 
    
    return(
      <div className="row card-area">
        <CardRow offset={topOffset} cards={topCards} />
        <CardRow offset={botOffset} cards={botCards} />
      </div>  
    );
  }
});

var CardRow = React.createClass({
  render: function() {
    var cards = [];
    for( var i = 0 ; i < this.props.cards.length ; i++ ) {
      
      var offset = (i == 1 && this.props.offset != 0) ? " offset-" + offset.toString() : "";
      cards.push(
        <div className={"col-sm-2 col-xs-3 player" + offset} >
          <img class="player-card" src="images/cardAssets/cardBack.png" />
          <span class="username" >{cards[i].name}</span>
          <span class="gold">{'Gold: ' + cards[i].coins}</span>
        </div>
      );
    }
    return(
      <div className="row card-row">
        {cards}
      </div>
    );
  }
});

var ActionArea = React.createClass({
  //TODO 
  render: function() {
    return(
      <div className="row action-area">
        <div className="col-sm-4 my-card-area">
          <span className="username" >MY CARD</span>
          <img className="my-card" src="images/cardAssets/cardBack.png" />
          <span className="username my-username" >{this.props.myName}</span>
          <span className="gold my-gold">Gold: 9</span>
        </div>
        <div className="col-sm-8 buttons-area">
          <img className="col-sm-6 action-button" src="images/zipboys/check.png" />
          <img className="col-sm-6 action-button" src="images/zipboys/swap.png" />
          <img className="col-sm-6 action-button" src="images/zipboys/claim.png" />
          <img className="col-sm-6 action-button" src="images/zipboys/fake.png" />
        </div>
      </div>
    );
  }    
});

function url(port, id) {
    var l = window.location;
    return ((l.protocol === "https:") ? "wss://" : "ws://") + l.hostname + (((l.port != 80) && (l.port != 443)) ? ":" + port : "") + "/" + id;
}

$(document).ready( function() {
  ReactDOM.render(
    React.createElement(Box, { 'username': 'landon' } ),
    document.getElementById('react-area')
  );
});