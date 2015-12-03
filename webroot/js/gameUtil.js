var ClaimArea = React.createClass({
  
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
  
  sendCard: function(card,e) {
    e.preventDefault();
    this.props.sendClaim( this.GameCard.indexOf(card));
  },
   
  render: function() {
    
    var cards = [];
    for( var i = 0 ; i < this.GameCard.length ; i++ ) {
      
      // TODO only push cards that should be in the game at the given moment
      
      cards.push(
        React.createElement('img', { className: 'player-card claim-card col-sm-2 col-xs-3',
                                     src: "images/cardAssets/" + this.GameCard[i] + ".png",
                                     onClick: this.sendCard.bind(this,this.GameCard[i]) })
      );
    }

    
    return (
      React.createElement(
        'div',
        { className: 'col-sm-8 buttons-area' },
        cards,
        React.createElement(
        'a',
        { href:'#', onClick: this.props.cancelClaim, className: 'btn btn-cancel' },
        'cancel'
        )
      )
    )
  }
});