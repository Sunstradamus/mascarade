var Box = React.createClass({
  render: function() {
    
    var data = getData(); // subject to change
    
    var entries = getEntries();
    var players = getPlayers(); 
    var centerCards = getCenterCards();
    
    return( 
      <div className="container game-area">
        <GameLog entries={entries}/>
        <GameArena playerName={this.props.playerName}/>
      </div>
    );
  }
});

var GameLog = React.createClass({
  render: function() {
    
    var entries = [];
    for( var entry in this.props.entries ) {
      var private = entry.hasOwnProperty("private") && entry["private"];
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
    return( <div className-"col-sm-9 game-arena">
              <CardArea players={this.props.players} />
              <ActionArea />
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
        case(3)
      }
  }
});

//LOTS MORE TODO

var player = React.createClass({
  //TODO
});

function getData() {
  //TODO
  return( { players: self.playerList, playerCards: self.playerCards, playerCoins: self.playerCoins, middle: self.centerCards })
}