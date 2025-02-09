import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { decompressTiles } from '../../../../../images/browser/ves-images-compressor';
import { ImageCompressionType } from '../../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/Base/VContainer';
import CanvasImage from '../../Common/CanvasImage';
import { BgmapMode, DisplayMode, SpriteType, Transparency } from '../../Common/VUEngineTypes';
import {
  ActorEditorContext,
  ActorEditorContextType,
  SpriteData
} from '../ActorEditorTypes';

interface SpritePreviewProps {
  animate: boolean
  dragging: boolean
  sprite: SpriteData
  frames: number
  currentAnimationFrame: number
  highlighted: boolean
  index: number
  palette: string
}

export default function SpritePreview(props: SpritePreviewProps): React.JSX.Element {
  const { animate, dragging, frames, currentAnimationFrame, highlighted, index, palette, sprite } = props;
  const { data, previewProjectionDepth, previewAnaglyph, setCurrentComponent } = useContext(ActorEditorContext) as ActorEditorContextType;
  const { setIsGenerating, services } = useContext(EditorsContext) as EditorsContextType;
  const [imageData, setImageData] = useState<number[][][][]>([]);
  const [height, setHeight] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [error, setError] = useState<string>();

  const isMultiFileAnimation = sprite.texture.files.length > 1;
  const isRepeated = data.sprites.type === SpriteType.Bgmap && (sprite.texture?.repeat?.x || sprite.texture?.repeat?.y);
  const effectiveHeight = isRepeated && sprite.texture?.repeat?.size?.y
    ? sprite.texture.repeat.size.y
    : sprite.colorMode === ColorMode.FrameBlend
      ? height / 2
      : height;
  const effectiveWidth = isRepeated && sprite.texture?.repeat?.size?.x
    ? sprite.texture.repeat.size.x
    : width;

  const setImageError = (e: string): void => {
    setHeight(32);
    setWidth(32);
    setError(e);
  };

  const getData = async () => {
    setIsGenerating(true);
    const allImageData: number[][][][] = [];

    if (!sprite._imageData || typeof sprite._imageData === 'number') {
      setIsGenerating(false);
      return setImageError('no image data');
    }

    await Promise.all(sprite._imageData?.images.map(async (singleImageData, i) => {
      if (!singleImageData.maps) {
        return;
      }
      const tilesData = await services.vesCommonService.unzipJson(singleImageData.tiles?.data) as string[];
      if (!tilesData) {
        return;
      }
      await Promise.all(singleImageData.maps.map(async (singleImageDataMap, j) => {
        const mapData = await services.vesCommonService.unzipJson(singleImageDataMap?.data) as string[];
        if (allImageData[i] === undefined) {
          allImageData[i] = [];
        }

        const uncompressedTilesData = sprite.compression === ImageCompressionType.RLE && singleImageData.tiles?.compressionRatio && singleImageData.tiles?.compressionRatio < 0
          ? decompressTiles(tilesData, sprite.compression)
          : tilesData;

        if (isMultiFileAnimation) {
          const uncompressedFrameTileOffsets = await services.vesCommonService.unzipJson(singleImageData.tiles?.frameOffsets) as number[];
          if (allImageData[i] === undefined) {
            allImageData[i] = [];
          }
          const frameMapSize = mapData.length / frames;
          for (let frameNumber = 0; frameNumber < frames; frameNumber++) {
            const currentFrameTileOffset = uncompressedFrameTileOffsets[frameNumber] - 1;
            const currentFrameTileSize = uncompressedFrameTileOffsets[frameNumber + 1] ? uncompressedFrameTileOffsets[frameNumber + 1] - 1 : undefined;
            const frameMapOffset = frameNumber * frameMapSize;
            const frameTileData = uncompressedTilesData.slice(currentFrameTileOffset, currentFrameTileSize);
            const frameMapData = mapData.slice(frameMapOffset, frameMapOffset + frameMapSize);

            allImageData[i][j + frameNumber] = services.vesImagesService.imageDataToPixelData(
              frameTileData,
              { ...singleImageDataMap, data: frameMapData },
              ImageCompressionType.NONE
            );
          }
        } else {
          allImageData[i][j] = services.vesImagesService.imageDataToPixelData(
            uncompressedTilesData,
            { ...singleImageDataMap, data: mapData },
            ImageCompressionType.NONE
          );
        }
      }));
    }));

    if (allImageData[0] && allImageData[0] && allImageData[0][0] && allImageData[0][0][0]) {
      setError(undefined);
      setHeight(allImageData[0][0].length);
      setWidth(allImageData[0][0][0].length);
      setImageData(allImageData);
    }

    setIsGenerating(false);
  };

  const getTransform = () => {
    const t: string[] = [];
    if (sprite.texture?.flip?.y) {
      t.push('scaleX(-1)');
    }
    if (sprite.texture?.flip?.x) {
      t.push('scaleY(-1)');
    }
    if (sprite.bgmapMode !== BgmapMode.Affine && sprite.displacement.parallax !== 0) {
      // compensate for scaling due to perspective
      t.push(`scale(${1 + (sprite.displacement.parallax / previewProjectionDepth)})`);
    }

    return (t.join(' '));
  };

  const currentPixelData: number[][][] = useMemo(() => {
    const result: number[][][] = [];

    if (animate && isMultiFileAnimation) {
      [0, 1].map(k => {
        if (imageData[k] && imageData[k][currentAnimationFrame]) {
          result.push(imageData[k][currentAnimationFrame]);
        }
      });
    } else {
      [0, 1].map(k => {
        if (imageData[k]) {
          imageData[k].map(i => result.push(i));
        }
      });
    }

    return result;
  }, [
    animate,
    isMultiFileAnimation,
    currentAnimationFrame,
    imageData
  ]);

  const baseZIndex = highlighted ? 999999 : 100000;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentComponent(`sprites-${index}`);
  };

  useEffect(() => {
    getData();
  }, [
    sprite._imageData,
  ]);

  return (
    <VContainer
      alignItems='center'
      justifyContent='center'
      onClick={handleClick}
      style={{ position: 'absolute' }}
    >
      {!error && isRepeated &&
        <CanvasImage
          height={effectiveHeight}
          palette={palette}
          pixelData={currentPixelData}
          displayMode={previewAnaglyph ? DisplayMode.Stereo : DisplayMode.Mono}
          parallaxDisplacement={sprite.displacement.parallax}
          repeatX={sprite.texture?.repeat?.x}
          repeatY={sprite.texture?.repeat?.y}
          width={effectiveWidth}
          colorMode={sprite.colorMode}
        />
      }
      <div
        className={error ? 'sprite-error' : ''}
        title={error ? error : ''}
        style={{
          borderRadius: highlighted ? .25 : 0,
          boxSizing: 'border-box',
          cursor: dragging ? 'grabbing' : 'pointer',
          height: effectiveHeight / (isMultiFileAnimation ? 1 : frames ?? 1),
          opacity: sprite.transparency !== Transparency.None ? .5 : 1,
          outline: highlighted ? '1px solid #0f0' : undefined,
          outlineOffset: 1,
          overflow: 'hidden',
          position: 'absolute',
          transform: getTransform(),
          translate: `${sprite.displacement.x}px ${sprite.displacement.y}px ${-1 * sprite.displacement.parallax}px`,
          zIndex: baseZIndex + (sprite.displacement.z !== 0 ? -sprite.displacement.z : 0),
        }}
      >
        {!error && currentPixelData &&
          <div style={{
            position: 'relative',
            top: animate && !isMultiFileAnimation
              ? (effectiveHeight / (frames ?? 1) * currentAnimationFrame * -1)
              : 0
          }}>
            {currentPixelData &&
              <CanvasImage
                height={effectiveHeight}
                palette={palette}
                pixelData={currentPixelData}
                displayMode={previewAnaglyph ? DisplayMode.Stereo : DisplayMode.Mono}
                parallaxDisplacement={sprite.displacement.parallax}
                width={effectiveWidth}
                colorMode={sprite.colorMode}
              />
            }
          </div>
        }
      </div>
    </VContainer>
  );
}
