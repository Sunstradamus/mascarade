"use strict";

var Box = React.createClass({
  displayName: "Box",

  render: function render() {

    var playerName = 'landon'; //change
    var data = getData(); // subject to change
    var entries = [{ message: "game started" }, { message: "your card is king", "private": true }]; //obviously change

    return React.createElement(
      "div",
      { className: "container game-area" },
      React.createElement(GameLog, { entries: entries }),
      React.createElement(GameArena, { playerName: playerName,
        players: data.players,
        playerCards: data.playerCards,
        coins: data.playerCoins })
    );
  }
});

var GameLog = React.createClass({
  displayName: "GameLog",

  render: function render() {

    var entries = [];
    for (var entry in this.props.entries) {
      var individual = entry.hasOwnProperty("private") && entry["private"];
      entries.push(React.createElement(
        "li",
        { className: private ? "private entry" : "private" },
        entry["message"]
      ));
    }

    return React.createElement(
      "div",
      { className: "col-sm-3 hidden-xs" },
      React.createElement(
        "div",
        { className: "game-log" },
        React.createElement(
          "ul",
          { className: "log-entries" },
          entries
        )
      )
    );
  }
});

var GameArena = React.createClass({
  displayName: "GameArena",

  render: function render() {

    var myCoins;
    for (var i = 0; i < this.props.players.length; i++) {
      if (this.props.players[i] == this.props.playerName) {
        myCoins = this.props.playerCoins[i];
      }
    }

    return React.createElement(
      "div",
      { className: "col-sm-9 game-arena" },
      React.createElement(CardArea, { players: this.props.players, playerCoins: this.props.playerCoins }),
      React.createElement(ActionArea, { myName: this.props.playerName, myCoins: myCoins })
    );
  }
});

var CardArea = React.createClass({
  displayName: "CardArea",

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
      "div",
      { className: "row card-area" },
      React.createElement(CardRow, { offset: topOffset, cards: topCards }),
      React.createElement(CardRow, { offset: botOffset, cards: botCards })
    );
  }
});

var CardRow = React.createClass({
  displayName: "CardRow",

  render: function render() {
    var cards = [];
    for (var i = 0; i < this.props.cards.length; i++) {

      var offset = i == 1 && this.props.offset != 0 ? " offset-" + offset.toString() : "";
      cards.push(React.createElement(
        "div",
        { className: "col-sm-2 col-xs-3 player" + offset },
        React.createElement("img", { "class": "player-card", src: "images/cardAssets/cardBack.png" }),
        React.createElement(
          "span",
          { "class": "username" },
          cards[i].name
        ),
        React.createElement(
          "span",
          { "class": "gold" },
          'Gold: ' + cards[i].coins
        )
      ));
    }
    return React.createElement(
      "div",
      { className: "row card-row" },
      cards
    );
  }
});

var ActionArea = React.createClass({
  //TODO 

  displayName: "ActionArea"
});

var player = React.createClass({
  //TODO

  displayName: "player"
});

function getData() {
  //TODO
  return { players: ['andy', 'andy1', 'andy2', 'andy3', 'andy4', 'andy5', 'landon'], playerCards: [], playerCoins: [6, 5, 7, 8, 9, 10], middle: [] };
}