'use strict';

(function() {

//
// This is the main scrip to animate the board.
//

const Players = require('./scripts/players').Players;
const Colors = require('./scripts/colors').Colors;
const Composition = require('./scripts/composition').Composition;
const KeyShortcuts = require('./scripts/key_shortcuts').KeyShortcuts;
const events = require('events');
const eventEmitter = new events.EventEmitter();
var checkerOption = 0;

var Checker = function(id,position,color) {
  console.log('instance created');
  this.id = id;
  this.position = position;
  this.color = color;
  this.status = "regular";
  };

function clear() {
  let compose = new Composition();
  compose.all(Colors.black);
  compose.commit();
}

function clearTimers() {
  clearTimeout(automationTimer);
  clearInterval(playerTurnTimer);
}

function setup() {
 // clear();

  let compose = new Composition();
  compose.borders(Colors.white);
  compose.commit();
}

Players.events.on('statechange', function(data) {
  if (gameHasStarted) {
    return;
  }

  let playerId = data.index;
  let onBoard = data.physical;

  let player = Players[playerId];
  let isAlreadyActive = player.active;

  if (isAlreadyActive && !onBoard) {
    playerTurn = playerId;
    reallyStartGame();

    let compose = new Composition();
    compose.players();
    compose.commit();
    lastComposition = compose;
  } else {
    player.active = onBoard;

    if (checkerOption != 1) {
    let compose = new Composition();
    compose.borders(Colors.white);
    compose.players();
    compose.commit();
  }
  }
});

function resolveTurn(playerId, move) {
  let player = Players[playerId];

  let compose = new Composition();
  compose.players();
  compose.positions();
    
  let destinations = getDestinations(player, move);
  compose.cells(player.position, destinations.regular, player.color);

  if (destinations.regular != destinations.final) {
    compose.lineEndArrow(destinations.final, player.color);
    compose.cell(destinations.final, player.color);
  }

  else if (destinations.regular == destinations.final) {
    compose.lineEndArrow(destinations.regular, player.color);
  }

  player.position = destinations.final;

  compose.commit();

  checkIfPlayerHasWin(playerId);

  lastComposition = compose;
  playerTurn++;
}

//Check if a special case like a chutes or ladders
const specialCases = [
  4, 15,
  8, 31,
  17, 7,
  20, 38,
  28, 84,
  40, 42,
  51, 67,
  53, 34,
  62, 19,
  63, 81,
  64, 60,
  71, 91,
  87, 24,
  93, 69,
  95, 76,
  99, 61
];

function getDestinations(player, move) {
  let rv = {};

  // Do dice/spinner move
  rv.regular = Math.min(player.position + move, 100);

  // Check if the player ends up on a snake or a ladder.
  rv.final = rv.regular;
  for (let i = 0; i < specialCases.length; i += 2) {
    if (rv.regular == specialCases[i]) {
      rv.final = specialCases[i+1];
      if (rv.final < rv.regular) {
        eventEmitter.emit('chute');
      }

      if (rv.final > rv.regular) {
        eventEmitter.emit('ladder');
      }
    }
  }

  return rv;
}

let automationTimer = null;
let playerTurnTimer = null;
let playerTurn = 0;
let gameHasStarted = false;

function checkIfPlayerHasWin(playerId) {
  let hasWin = Players[playerId].position >= 100;
  if (!hasWin) {
    return;
  }

  clearTimeout(automationTimer);
  clearInterval(playerTurnTimer);

  // TODO
  // Would be much better to animate the borders with an animation
  let msg = 'Player ' + playerId + ' has won!';
  console.log(msg);

  eventEmitter.emit('gameended', { playerId: playerId });
}

function diceRoll() {
  return Math.floor(Math.random() * 5) + 1;
}

function getNextPlayer() {
  let playerId = -1;

  for (let i = playerTurn; i < 4; i++) {
    let player = Players[i];
    if (player.active) {
      playerTurn = i;
      return playerTurn;
    }
  }

  for (let i = 0; i < playerTurn; i++) {
    let player = Players[i];
    if (player.active) {
      playerTurn = i;
      return playerTurn;
    }
  }

  return playerTurn;
}

let lastComposition = null;
let lastCompositionIsPainted = true;
function blinkPlayerTurn() {
  if (!lastComposition) {
    return;
  }

  if (lastCompositionIsPainted) {
    let compose = lastComposition.clone();
    compose.player(getNextPlayer(), Colors.black);
    compose.commit();
  } else {
    lastComposition.commit();
  }
  lastCompositionIsPainted = !lastCompositionIsPainted;
}

function reallyStartGame() {
  gameHasStarted = true;
  blinkPlayerTurn();
  playerTurnTimer = setInterval(blinkPlayerTurn, 400);
  eventEmitter.emit('gamestarted');
}

function ensureGameIsStarted() {
  if (!gameHasStarted) {
    reallyStartGame();
  }
}

function playTurn() {
  ensureGameIsStarted();
  Players[getNextPlayer()].move(diceRoll());
}

function playAutomatedGame() {
  ensureGameIsStarted();
  playTurn();
  automationTimer = setTimeout(playAutomatedGame, 1000);
}

var activeCheckers = [];

function initializeCheckerboard() {
  var checkerId = 0;
  for (var i = 1; i<21; i=i+2) {
    var temp = new Checker(checkerId, i, "red");
    console.log("color: " + temp.color);
    activeCheckers.push(temp);
    checkerId = checkerId + 1;
  }

  for (var i=99; i>80; i=i-2) {
    var temp = new Checker(checkerId, i, "blue");
    activeCheckers.push(temp);
    console.log("color: " + temp.color);
    checkerId = checkerId + 1;
  }

  paintCheckerBoard();
}



function paintCheckerBoard() {
  let compose = new Composition();
  console.log("reached paint function");
  console.log("This is the length: " + activeCheckers.length);
  for (var i =0; i<activeCheckers.length; i++) {
      var temp = activeCheckers[i];
      console.log("SUP");
      if (activeCheckers[i].color == "red") {
            console.log("Got a red");
            console.log("Position: " + activeCheckers[i].position);
            console.log("Id: " + activeCheckers[i].id);
            compose.checker(activeCheckers[i].position, Colors.red);             
      }

    if (activeCheckers[i].color == "blue") {
            console.log("Got a blue");
            console.log("Position: " + activeCheckers[i].position);
            console.log("Id: " + activeCheckers[i].id);
            compose.checker(activeCheckers[i].position, Colors.blue);             
      }


  }

  compose.commit();
}



//Global variable for checker turns
var currentChecker = 0;
var moveTo = 0;

//Checkers turn event
// Function to change the content of t2
function getCheckerCaseId() {
  //alert(this.id);
  var str = "";
  str = this.id.toString();
  var last2 = str.slice(-2);
  var idInt = parseInt(last2);
  idInt = 100-idInt;

  if (idInt <=10) {
      var temp = Math.abs(11-idInt);
      idInt = temp;
    }

  if (idInt <31 && idInt>20) {
     idInt = Math.abs(31-idInt) + 20;
   }

  if (idInt <51 && idInt>40) {
     idInt = Math.abs(51-idInt) + 40;
   }

  if (idInt <71 && idInt>60) {
     idInt = Math.abs(71-idInt) + 60;
   }

  if (idInt <91 && idInt>80) {
     idInt = Math.abs(91-idInt) + 80;
   }



  if (currentChecker == 0) {
    currentChecker = idInt;
  }

  else  {
    moveTo = idInt;
    alert("Current Checker ID: " + currentChecker);
    alert("move Checker ID: " + moveTo);
    checkersTurn(currentChecker,moveTo);
  }


}

// add event listener to all cases
var checkersCases = document.getElementsByClassName("case");

//Initialize event listeners
for (var i=0; i<checkersCases.length-1; i++) {
checkersCases[i].addEventListener("click", getCheckerCaseId);
}

//This is the event that will be triggered by a 2nd click
function checkersTurn(activeCheckerId, newPosition) {
    currentChecker = 0;
    moveTo = 0;
    var thisTurnChecker=0;
    for (var i =0; i<activeCheckers.length; i++) {
      if (activeCheckers[i].position == activeCheckerId) {
        activeCheckers[i].position = newPosition;
        alert("New position: " + activeCheckers[i].position);
        //Repaint the checker board
        paintCheckerBoard();

       // thisTurnChecker = activeCheckers[i];
      }

      //If there is another checker in the same position
     // if ((activeCheckers[i].position == thisTurnChecker.position) && (activeCheckers[i].id != thisTurnChecker.if)) {
        
        //Remove that checker from the array
     //   activeCheckers.splice(i, 1);
        //Play sad sound and update checkers total: TODO
    //  }

    }
}


Players.events.on('playermove', function(data) {
  ensureGameIsStarted();
  resolveTurn(data.index, data.move);
});

//setup();

KeyShortcuts.on('next', playTurn);

const Game = {
  playAutomatedGame: playAutomatedGame,
  playTurn: playTurn,
  initializeCheckerboard: initializeCheckerboard,
  events: eventEmitter
};

exports.Game = Game;
})();
