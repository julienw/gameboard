// This file emulates a real board

(function() {

const Hardware = (function Hardware() {
  'use strict';

  const Constants = {
    HeaderSize: 2,
    FooterSize: 1,
    PixelSize: 3, // 3 colors
    Width: 96,
    Height: 16,
    BoardCount: 3, // this needs to be a proper divider of the led count
  };

  let leds;

  function updateLed(id, r, g, b) {
    if (r === 0 && g === 0 && b === 0) { // TODO use blend-mode ?
      leds[id].style.backgroundColor = 'transparent';
    } else {
      leds[id].style.backgroundColor = 'rgb(' + r + ', ' + g + ', ' + b + ')';
    }
  }

  function update(buffer) {
    if (!leds) {
      leds = document.getElementsByClassName('led');

      const kLedsCount = Constants.Width * Constants.Height;
      if (leds.length !== kLedsCount) {
        let msg = 'The total number of leds should be ' + kLedsCount + '.\n' +
                  'Current count is ' + leds.length + '.';
        throw new Error(msg);
      }
    }

    const begin = Constants.HeaderSize;
    const end = buffer.length - Constants.FooterSize;

    for (let i = begin, id = 0; i < end; i += Constants.PixelSize, id++) {
      updateLed(id, buffer[i], buffer[i + 1], buffer[i + 2]);
    }
  }

  return {
    update: update,
    Constants: Constants
  };
})();

exports.Hardware = Hardware;

})();
