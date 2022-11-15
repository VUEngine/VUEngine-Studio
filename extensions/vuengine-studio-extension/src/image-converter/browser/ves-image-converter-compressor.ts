import { AnimationConfig, COMPRESSION_FLAG_LENGTH, ImageConverterCompressor, TilesCompressionResult } from './ves-image-converter-types';

export function compressTiles(tilesData: string[], compressor: ImageConverterCompressor, animationConfig: AnimationConfig): TilesCompressionResult {
  switch (compressor) {
    case ImageConverterCompressor.RLE:
      return compressTilesRle(tilesData, animationConfig);
    default:
      return {
        tilesData: tilesData,
        frameTileOffsets: [],
        compressionRatio: (0).toFixed(2),
      };
  }
}

// Normal RLE applied to pixel pairs (4 bits or 1 hexadecimal digit)
function compressTilesRle(tilesData: string[], animationConfig: AnimationConfig): TilesCompressionResult {
  const result: TilesCompressionResult = {
    tilesData: tilesData,
    frameTileOffsets: [],
    compressionRatio: (0).toFixed(2),
  };

  if (!tilesData.length) {
    return result;
  }

  const uncompressedLength = tilesData.length;
  const compressedData: string[] = [];
  let currentBlock = '';
  let counter = 0;
  let currentDigit = tilesData[0][0] ?? '';

  const isSpritesheet = animationConfig.isAnimation && !animationConfig.individualFiles;
  const spritesheetFrameSize = (4 * animationConfig.frameWidth * animationConfig.frameHeight) || 4;

  if (isSpritesheet) {
    result.frameTileOffsets = [COMPRESSION_FLAG_LENGTH];
  }

  for (const [index, tileData] of tilesData.entries()) {
    for (const digit of tileData) {
      if (digit === currentDigit) {
        if (counter === 16) {
          currentBlock += (counter - 1).toString(16).toUpperCase() + currentDigit;
          if (currentBlock.length === 8) {
            compressedData.push(currentBlock);
            currentBlock = '';
          }
          counter = 1;
        } else {
          counter++;
        }
      } else {
        currentBlock += (counter - 1).toString(16).toUpperCase() + currentDigit;
        if (currentBlock.length === 8) {
          compressedData.push(currentBlock);
          currentBlock = '';
        }
        currentDigit = digit;
        counter = 1;
      }
    }

    if (isSpritesheet && ((index + 1) % spritesheetFrameSize === 0)) {
      // right-pad individual frames
      if (currentBlock.length > 0) {
        compressedData.push(currentBlock.padEnd(8, '0'));
      }

      // reset variables
      currentBlock = '';
      counter = 0;
      currentDigit = tilesData[index + 1] ? tilesData[index + 1][0] : '';

      // save tile offset
      result.frameTileOffsets.push(compressedData.length + COMPRESSION_FLAG_LENGTH);
    }
  };

  if (isSpritesheet) {
    result.frameTileOffsets.pop();
  } else {
    currentBlock += (counter - 1).toString(16).toUpperCase() + currentDigit;
    // right-pad last block
    compressedData.push(currentBlock.padEnd(8, '0'));
  }

  result.tilesData = compressedData;
  result.compressionRatio = (- ((uncompressedLength - compressedData.length) / uncompressedLength * 100)).toFixed(2);

  return result;
}
