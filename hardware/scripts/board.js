'use strict';

{
  const { Hardware } = require('./hardware');
  function createElement(id, className) {
    let element = document.createElement('div');
    if (id) {
      element.id = id;
    }
    element.className = className;
    return element;
  }

  function buildBoard() {
    let board = createElement('board', 'board');
    const ledCount = Hardware.Constants.Width * Hardware.Constants.Height;
    const boardCount = Hardware.Constants.BoardCount;
    const ledCountByBoard = ledCount / boardCount;

    let boardPart;
    let boardCounter = 0;

    for (let i = 0; i < ledCount; i++) {
      if (i % ledCountByBoard === 0) {
        boardPart =
          createElement(null, `board-part board-part-${boardCounter}`);
        board.appendChild(boardPart);
        boardCounter++;
      }
      let led = createElement('led_' + i, 'led');
      boardPart.appendChild(led);
    }

    document.body.appendChild(board);
  }

  function buildVirtualBoard() {
    let virtual = createElement('virtual', 'virtual');

    let content = createElement('content', 'content');
    for (let i = 0; i < 100; i++) {
      let c = createElement('case_' + i, 'case');
      content.appendChild(c);
    }

    virtual.appendChild(content);
    document.body.appendChild(virtual);
  }

  buildBoard();
  // not sure what it's for
  // buildVirtualBoard();
}
