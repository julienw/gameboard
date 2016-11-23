'use strict';

(function() {
  function Color(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
  }

  const Colors = {
    white:  new Color(255, 255, 255),
    black:  new Color(0, 0, 0),
    red:    new Color(255, 0, 0),
    blue:   new Color(0, 0, 255),
    green:  new Color(0, 255, 0),
    yellow: new Color(255, 255, 0),
  };

  exports.Colors = Colors;
  exports.Color = Color;
})();
