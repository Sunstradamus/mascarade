var Box = React.createClass({
  render: function() {
    
	var playerName = 'landon'; //change
    var data = getData(); // subject to change
	var entries = [{message: "game started"}, {message: "your card is king", private: true}]; //obviously change
       
    return( 
      <div className="container game-area">
        <GameLog entries={entries}/>
        <GameArena playerName={playerName} 
		           players={data.players} 
				   playerCards={data.playerCards}
				   coins={data.playerCoins} />
      </div>
    );
  }
});

var GameLog = React.createClass({
  render: function() {
    
    var entries = [];
    for( var entry in this.props.entries ) {
      var individual = entry.hasOwnProperty("private") && entry["private"];
      entries.push( <li className={private ? "private entry" : "private"}>
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
              <ActionArea myName={this.props.playerName} myCoins={myCoins}/>
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
});

var player = React.createClass({
  //TODO
});

function getData() {
  //TODO
  return( { players: ['andy','andy1','andy2','andy3','andy4','andy5','landon'], playerCards: [], playerCoins: [6,5,7,8,9,10], middle: [] })
}