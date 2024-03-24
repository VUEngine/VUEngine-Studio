import React, { useContext, useEffect, useState } from 'react';
import { ImageData } from '../../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import CanvasImage from '../../Common/CanvasImage';
import { BgmapMode, DisplayMode, SpriteType, Transparency } from '../../Common/VUEngineTypes';
import { EntityEditorContext, EntityEditorContextType, SpriteData } from '../EntityEditorTypes';
import VContainer from '../../Common/VContainer';

interface SpriteProps {
  animate: boolean
  sprite: SpriteData
  frames: number
  currentAnimationFrame: number
  highlighted: boolean
  index: number
  palette: string
}

export default function Sprite(props: SpriteProps): React.JSX.Element {
  const { data, state, setState } = useContext(EntityEditorContext) as EntityEditorContextType;
  const { setIsGenerating, setGeneratingProgress, services } = useContext(EditorsContext) as EditorsContextType;
  const {
    animate,
    frames,
    currentAnimationFrame,
    highlighted,
    index,
    palette,
    sprite,
  } = props;
  const [imageData, setImageData] = useState<ImageData[][]>([]);
  const [height, setHeight] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [error, setError] = useState<string>();

  const isMultiFileAnimation = sprite.texture.files.length > 1;
  const isRepeated = data.sprites.type === SpriteType.Bgmap && (sprite.texture?.repeat?.x || sprite.texture?.repeat?.y);
  const effectiveHeight = isRepeated && sprite.texture?.repeat?.size?.y
    ? sprite.texture.repeat.size.y
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
    const allImageData: ImageData[][] = [[], []];
    let totalFiles = 0;
    let processedFiles = 0;

    if (sprite.texture?.files?.length) {
      const fileArrays = [sprite.texture.files];
      if (state.preview.anaglyph && sprite.texture?.files2?.length) {
        fileArrays.push(sprite.texture.files2);
      }

      fileArrays.map(f => {
        totalFiles += f.length;
      });

      await services.workspaceService.ready;
      const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;
      await Promise.all(fileArrays.map(async (f, i) => {
        await Promise.all(f.map(async (image, j) => {
          const imageUri = workspaceRootUri.resolve(image);
          if (await services.fileService.exists(imageUri)) {
            const imageFileContent = await services.fileService.readFile(imageUri);
            const singleImageData = await window.electronVesCore.parsePng(imageFileContent);
            if (singleImageData) {
              if (singleImageData.colorType !== 3) {
                setImageError('wrong color type');
              } else {
                allImageData[i] = [
                  ...allImageData[i].slice(0, j),
                  singleImageData,
                  ...allImageData[i].slice(j),
                ];
                setHeight(singleImageData.height);
                setWidth(singleImageData.width);
              }
            } else {
              setImageError('could not parse image');
            }
          } else {
            setImageError('file not found');
          }

          setGeneratingProgress(++processedFiles, totalFiles);
        }));
      }));
    } else {
      setImageError('no file selected');
    }

    if (allImageData[0] && allImageData[0].length) {
      setError(undefined);
    }
    setImageData(allImageData);

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

  const currentPixelData: number[][][] = [];
  if (animate && isMultiFileAnimation) {
    [0, 1].map(k => {
      if (imageData[k] && imageData[k][currentAnimationFrame]) {
        currentPixelData.push(imageData[k][currentAnimationFrame].pixelData);
      }
    });
  } else {
    [0, 1].map(k => {
      if (imageData[k] && imageData[k][0]) {
        currentPixelData.push(imageData[k][0].pixelData);
      }
    });
  }

  const baseZIndex = highlighted ? 999999 : 100000;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setState({ currentComponent: `sprites-${index}` });
  };

  useEffect(() => {
    getData();
  }, [
    height,
    sprite.texture.files.length,
    width,
    state.preview.anaglyph,
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
      {isRepeated &&
        <CanvasImage
          height={effectiveHeight}
          palette={palette}
          pixelData={currentPixelData}
          displayMode={state.preview.anaglyph ? DisplayMode.Stereo : DisplayMode.Mono}
          parallaxDisplacement={sprite.displacement.parallax}
          repeatX={sprite.texture?.repeat?.x}
          repeatY={sprite.texture?.repeat?.y}
          width={effectiveWidth}
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
        {!error && imageData.length > 0 &&
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
              />
            }
          </div>
        }
      </div>
    </VContainer>
  );
}
