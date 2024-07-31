import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import CanvasImage from '../../Common/CanvasImage';
import VContainer from '../../Common/VContainer';
import { BgmapMode, DisplayMode, SpriteType, Transparency } from '../../Common/VUEngineTypes';
import { EntityEditorContext, EntityEditorContextType, SpriteData } from '../EntityEditorTypes';

interface SpritePreviewProps {
  animate: boolean
  sprite: SpriteData
  frames: number
  currentAnimationFrame: number
  highlighted: boolean
  index: number
  palette: string
}

export default function SpritePreview(props: SpritePreviewProps): React.JSX.Element {
  const { data, state, setState } = useContext(EntityEditorContext) as EntityEditorContextType;
  const { setIsGenerating, services } = useContext(EditorsContext) as EditorsContextType;
  const {
    animate,
    frames,
    currentAnimationFrame,
    highlighted,
    index,
    palette,
    sprite,
  } = props;
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
      const uncompressedTileData = await services.vesCommonService.uncompressJson(singleImageData.tiles?.data) as string[];
      if (singleImageData.maps) {
        await Promise.all(singleImageData.maps.map(async (singleImageDataMap, j) => {
          const uncompressedMapData = await services.vesCommonService.uncompressJson(singleImageDataMap?.data) as string[];
          if (allImageData[i] === undefined) {
            allImageData[i] = [];
          }
          allImageData[i][j] = services.vesImagesService.imageDataToPixelData(uncompressedTileData, { ...singleImageDataMap, data: uncompressedMapData });
          // setGeneratingProgress(++processedFiles, totalFiles);
        }));
      }
    }));
    if (allImageData[0].length && allImageData[0][0].length && allImageData[0][0][0].length) {
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
      t.push(`scale(${1 + (sprite.displacement.parallax / state.preview.projectionDepth)})`);
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
    imageData
  ]);

  const baseZIndex = highlighted ? 999999 : 100000;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setState({ currentComponent: `sprites-${index}` });
  };

  useEffect(() => {
    getData();
  }, [
    sprite._imageData,
  ]);

  /*
  const onKeyDown = (e: KeyboardEvent): void => {
    console.log(ref.current?.contains(document.activeElement));
    if (document.activeElement === ref.current) {
      if (!e.repeat) {
        switch (e.code) {
          case 'ArrowUp':
            return moveCurrentComponent(0, -1);
          case 'ArrowDown':
            return moveCurrentComponent(0, 1);
          case 'ArrowLeft':
            return moveCurrentComponent(-1, 0);
          case 'ArrowRight':
            return moveCurrentComponent(1, 0);
        }
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);
  */

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
          displayMode={state.preview.anaglyph ? DisplayMode.Stereo : DisplayMode.Mono}
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
          cursor: 'pointer',
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
                displayMode={state.preview.anaglyph ? DisplayMode.Stereo : DisplayMode.Mono}
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
