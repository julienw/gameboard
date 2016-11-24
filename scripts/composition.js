'use strict';

// The board is made up of 1024 leds. They are ordered as a 32x32 matrix.
// Each led is made of 3 components:
//  1. red
//  2. green
//  3. blue
//
// The board communicates using a single protocol call. The protocol
// expects a unsigned int 8 buffer with the state of every led.
// 
// The buffer contains the information for the 1024 leds, and the
// value of each components (r, g, b). The buffer size is then 3072 (1024 * 3).
//
// The buffer is organized such as:
// led0_r, led0_g, led0_b, led1_r, led1_g, led1_r, led2_r, led2_g, led2_b, ...
// ... led1022_r, led1022_g, led1022_b, led1023_r, led_1023_g, led1023_b
//
// So a buffer to turn red led 0 will be:
// 255, 0, 0, ... 0, 0, 0
//
// A buffer to turn led 0 white (all the 3 components are set to 255):
// 255, 255, 255, 0, 0, 0, ... 0, 0, 0
//
// A buffer to turn led 0 red and led 1 white:
// 255, 0, 0, 255, 255, 255, 0, 0, 0, ... 0, 0, 0
//

(function() {
  'use strict';

  const Hardware = require('./hardware').Hardware;
  const HardwareProxy = require('./proxy').HardwareProxy;
  const Players = require('./players').Players;

  const pixelSize = Hardware.Constants.PixelSize;

  const physicalWidth = HardwareProxy.Constants.Width;
  const physicalWidthInPixels = HardwareProxy.Constants.Width * pixelSize;
  const physicalHeight = HardwareProxy.Constants.Height;

  const boardWidth = 32;
  const boardWidthInPixels = boardWidth * pixelSize;
  const boardHeight = 32;

  const boardOffset = {
    left: 1,
    bottom: 1 * boardWidth,
    right: 1,
    top: 1 * boardHeight
  };


  function updateLedById(buffer, id, color) {
    buffer[id * pixelSize + 0] = color.r;
    buffer[id * pixelSize + 1] = color.g;
    buffer[id * pixelSize + 2] = color.b;
  }

  function updateBufferRowRange(buffer, index, begin, end, color) {
    begin = (begin * pixelSize) + (index * boardWidthInPixels);
    end = (end * pixelSize) + (index * boardWidthInPixels);

    for (let i = begin; i < end; i += pixelSize) {
      buffer[i + 0] = color.r;
      buffer[i + 1] = color.g;
      buffer[i + 2] = color.b;
    }
  }

  function updateBufferColumnRange(buffer, index, begin, end, color) {
    begin = (index * pixelSize) + (begin * boardWidthInPixels);
    end = end * boardWidthInPixels;

    for (let i = begin; i < end; i += boardWidthInPixels) {
      buffer[i + 0] = color.r;
      buffer[i + 1] = color.g;
      buffer[i + 2] = color.b;
    }
  }

  function updateBufferRow(buffer, index, color) {
    updateBufferRowRange(buffer, index, 0, boardWidth, color);
  }

  function updateBufferColumn(buffer, index, color) {
    updateBufferColumnRange(buffer, index, 0, boardHeight, color);
  }

  function updateBufferRange(buffer, begin, end, color) {
    for (let i = begin * pixelSize; i < end * pixelSize; i += pixelSize) {
      buffer[i + 0] = color.r;
      buffer[i + 1] = color.g;
      buffer[i + 2] = color.b;
    }
  }


  function updatePlayerBorder(buffer, playerId, color) {
    let player = Players[playerId];

    if (!color) {
      color = player.color;
    }
    for (let side in player.sides) {
      let begin = player.sides[side];
      if (begin === -1) {
        continue;
      }

      switch (side) {
        case 'top': {
          let end = begin + (boardWidth / 2);
          updateBufferRowRange(buffer, 0, begin, end, color);
          break;
        }

        case 'bottom': {
          let end = begin + (boardWidth / 2);
          updateBufferRowRange(buffer, boardHeight - 1, begin, end, color);
          break;
        }

        case 'left': {
          let end = begin + (boardHeight / 2);
          updateBufferColumnRange(buffer, 0, begin, end, color);
          break;
        }

        case 'right': {
          let end = begin + (boardHeight / 2);
          updateBufferColumnRange(buffer, boardWidth - 1, begin, end, color);
          break;
        }
      }
    }
  }

  function getIdsForCase(id) {
    // While the physical board is 32x32 pixels, the game board itself is a 10x10
    // case. Each case is then 3x3 pixels wide, and there is an offset of 1 pixel
    // on every sides.
    //
    // The game board coordinate system is also starting bottom-left, while our
    // physical board is top-left. Which means we need to apply a transformation
    // from one coordinate system to another.
    //
    // Lastly, the game board ordering of rows and columns follow a 'snake'
    // pattern, where the end column of a row map to the start column of the next
    // row.

    // Step 0. Apply the side offsets to our coordinates
    let offset = boardOffset.top + boardOffset.left;

    // Step 1. Convert the board row/column information to a physical coord.
    //         Going from 10x10 coordinates system starting bottom-left, to
    //         a 32x32 coordinates system starting top-left

    // The board ids are going from 1-100, while the array indexes are going
    // 0-99.
    id = id - 1;

    // Split the absolute number to row/column information. This way they can be
    // worked on individually.
    let row = Math.floor(id / 10);
    let column = id % 10;

    // Invert column depending if the row is odd or even. This is to match the
    // behavior of our board plate.
    if (row % 2) {
      column = 9 - column;
    }
    row = 9 - row;

    // Translate row/colum coordinate to the physical coordinate
    column = column * 3;
    row = row * 3 * boardWidth;

    // Step 3. Calculate the starting led for our case
    let coordinate = offset + row + column;


    // Step 4. Finally returns a 3x3 square leds id to represent a particular
    //         case.
    let rv = [];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        rv.push(coordinate + (i * boardWidth) + j);
      }
    }

    return rv;
  }

  function updateTopBorder(buffer, color) {
    updateBufferRow(buffer, 0, color);
  }

  function updateBottomBorder(buffer, color) {
    updateBufferRow(buffer, boardHeight - 1, color);
  }

  function updateLeftBorder(buffer, color) {
    updateBufferColumn(buffer, 0, color);
  }

  function updateRightBorder(buffer, color) {
    updateBufferColumn(buffer, boardWidth - 1, color);
  }




  /* Public methods */

  function all(buffer, color) {
    updateBufferRange(buffer, 0, boardWidth * boardHeight, color);
  }

  function borders(buffer, color) {
    updateTopBorder(buffer, color);
    updateBottomBorder(buffer, color);
    updateLeftBorder(buffer, color);
    updateRightBorder(buffer, color);
  }

   function lineEndArrow(buffer, id, color) {
        var ledArray = getIdsForCase(id);
        updateLedById(buffer, ledArray[1], color);
        updateLedById(buffer, ledArray[3], color);
        updateLedById(buffer, ledArray[5], color);
        updateLedById(buffer, ledArray[7], color);
  }

  function cell(buffer, id, color) {
     var ledArray = getIdsForCase(id);
     for (var i = 3; i<ledArray.length-3; i++) {
      updateLedById(buffer, ledArray[i], color);
    }
  }

  function cells(buffer, begin ,end, color) {
    for (let i = begin; i <= end; i++) {
       cell(buffer, i, color);
     }
  }

  function playerDotPosition(buffer,id,color, playerId) {
    var ledArray = getIdsForCase(id);
    
    if (playerId ==0) {
      updateLedById(buffer, ledArray[0], color);
    }
 
    if (playerId ==1) {
      updateLedById(buffer, ledArray[6], color);
    }
 
     if (playerId ==2) {
      updateLedById(buffer, ledArray[8], color);
    }

    if (playerId ==3) {
      updateLedById(buffer, ledArray[2], color);
    }
  }

  function player(buffer, playerId, color) {
    updatePlayerBorder(buffer, playerId, color);
  }

  function players(buffer) {
    for (let i = 0; i < 4; i++) {
      Players[i].active && updatePlayerBorder(buffer, i);
    }
  }

  function position(buffer, playerId) {
    let player = Players[playerId];
    if (player && player.active) {
      playerDotPosition(buffer, player.position, player.color, playerId);
    }
  }

  function positions(buffer) {
    for (let i = 0; i < 4; i++) {
      position(buffer, i);
    }
  }

  function commit(buffer, callback) {
    HardwareProxy.write(buffer, callback);
  }

  function clone(buffer) {
    return new Composition(buffer.slice(0));
  }

  function Composition(buffer) {
    buffer = buffer || new Uint8Array(HardwareProxy.size());

    this.all = all.bind(this, buffer);
    this.borders = borders.bind(this, buffer);
    this.cell = cell.bind(this, buffer);
    this.cells = cells.bind(this, buffer);
    this.lineEndArrow = lineEndArrow.bind(this,buffer);
    this.player = player.bind(this, buffer);
    this.players = players.bind(this, buffer);
    this.position = position.bind(this, buffer);
    this.positions = positions.bind(this, buffer);
    this.commit = commit.bind(this, buffer);
    this.clone = clone.bind(this, buffer);
  };

  exports.Composition = Composition;
})();


