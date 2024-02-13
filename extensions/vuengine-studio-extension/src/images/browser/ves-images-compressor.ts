import { AnimationConfig, COMPRESSION_FLAG_LENGTH, ImageCompressionType, TilesCompressionResult } from './ves-images-types';

export function compressTiles(tilesData: string[], compressor: ImageCompressionType, animationConfig: AnimationConfig, allowInflate: boolean = false): TilesCompressionResult {
  let compressionResult: TilesCompressionResult = {
    data: tilesData,
    frameOffsets: [],
    compressionRatio: 0,
  };

  switch (compressor) {
    case ImageCompressionType.RLE:
      compressionResult = compressTilesRle(tilesData, animationConfig);
      break;
  }

  // discard compression results if they're not smaller than the original size
  if (!allowInflate && compressionResult.compressionRatio && compressionResult.compressionRatio >= 0) {
    compressionResult.data = tilesData;
    delete compressionResult.frameOffsets;
  }

  return compressionResult;
}

// Normal RLE applied to pixel pairs (4 bits or 1 hexadecimal digit)
function compressTilesRle(tilesData: string[], animationConfig: AnimationConfig): TilesCompressionResult {
  const result: TilesCompressionResult = {
    data: tilesData,
    compressionRatio: 0,
  };

  if (!tilesData.length) {
    return result;
  }

  const uncompressedLength = tilesData.length;
  const compressedData: string[] = [];
  let currentBlock = '';
  let counter = 0;
  let previousDigit = tilesData[0][0] ?? '';

  const isSpritesheet = animationConfig.isAnimation && !animationConfig.individualFiles;
  const spritesheetFrameSize = (animationConfig.frames > 0) ? tilesData.length / animationConfig.frames : 4;

  if (isSpritesheet) {
    result.frameOffsets = [];
  }

  const addPreviousDigitToCurrentBlock = () => {
    currentBlock += (counter - 1).toString(16).toUpperCase() + previousDigit;
    counter = 1;
  };

  for (const [index, tileData] of tilesData.entries()) {
    for (const digit of tileData) {
      if (digit === previousDigit && counter < 16) {
        counter++;
      } else {
        addPreviousDigitToCurrentBlock();
        if (currentBlock.length === 8) {
          compressedData.push(currentBlock);
          currentBlock = '';
        }
        previousDigit = digit;
      }
    }

    if (isSpritesheet && ((index + 1) % spritesheetFrameSize === 0)) {
      // conclude and save last character's count if it wasn't in the last loop of tileData
      if (counter > 1) {
        addPreviousDigitToCurrentBlock();
      }

      // right-pad individual frames
      if (currentBlock.length > 0) {
        compressedData.push(currentBlock.padEnd(8, '0'));
      }

      // reset variables
      currentBlock = '';
      counter = 0;
      previousDigit = tilesData[index + 1] ? tilesData[index + 1][0] : '';

      // save tile offset
      result.frameOffsets!.push(compressedData.length + COMPRESSION_FLAG_LENGTH);
    }
  };

  if (isSpritesheet) {
    result.frameOffsets!.unshift(COMPRESSION_FLAG_LENGTH);
    result.frameOffsets!.pop();
  } else {
    addPreviousDigitToCurrentBlock();
    // right-pad last block
    compressedData.push(currentBlock.padEnd(8, '0'));
  }

  result.data = compressedData;
  result.compressionRatio = - ((uncompressedLength - compressedData.length) / uncompressedLength * 100);

  return result;
}
