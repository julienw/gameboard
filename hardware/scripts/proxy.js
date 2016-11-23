// This files converts the data between the game layout and the
// physical/emulated board handled by Hardware.

(function() {

const HardwareProxy = (function HardwareProxy() {
  const Hardware = require('./hardware').Hardware;

  'use strict';

  const Constants = {
    Width: 32,
    Height: 48,
  };

  function size() {
    return Constants.Width *
           Constants.Height *
           Hardware.Constants.PixelSize;
  }

  function assert(value, msg) {
    if (!value) {
      throw new Error(msg);
    }
  }

  function* splitTypedArray(buffer, count) {
    for (let i = 0; i < buffer.length; i += count) {
      yield buffer.subarray(i, i + count);
    }
  }

  function applyProtocol(inBuffer) {
    'use strict';

    const { Width, Height, HeaderSize, FooterSize, PixelSize } = Hardware.Constants;
    const outBuffer = new Uint8Array(
      HeaderSize +
      (Width * Height * PixelSize) +
      FooterSize
    );

    // Write Header
    outBuffer[0] = 0x02;
    outBuffer[1] = 0x01;

    // Write Footer
    outBuffer[outBuffer.length - 1] = 0x0A;

    // Write Content
    //
    // Our firmware assume we have 3 16x32 chained boards handled as a unique
    // 16x96 board.
    // Additionally the 2nd board is rotated.
    //
    // The logic here is converting the coordinates from 32x48 to 16x96.
    //
    // All this happens at the cost of performance. It should be fine for now
    // but if we continue to prototype with this board and expect 60 fps it
    // will be definitively better to have a new firmware.

    // 512 is how many leds we have in 1 board.
    const step = 512 * PixelSize;
    outBuffer.set(inBuffer.subarray(0, step), HeaderSize);
    const pixelsInMiddleBoard =
      splitTypedArray(inBuffer.subarray(step, step * 2), 3);
    let pixelsCount = 0;
    for (const pixel of pixelsInMiddleBoard) {
      pixelsCount += PixelSize;
      const where = HeaderSize + step * 2 - pixelsCount;
      outBuffer.set(pixel, where);
    }
    outBuffer.set(inBuffer.subarray(step * 2, step * 3), HeaderSize + step * 2);

    return outBuffer;
  }

  function write(buffer, callback) {
    'use strict';

    let msg = 'Buffer length (' + buffer.length + ') should be ' + size() + '.';
    assert(buffer.length === size(), msg);

    Hardware.update(applyProtocol(buffer), callback);
  }

  return {
    Constants: Constants,
    size: size,
    write: write
  };
})();

exports.HardwareProxy = HardwareProxy;

})();

