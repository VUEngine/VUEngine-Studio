import React, { useContext, useEffect, useState } from 'react';
import { ImageData } from '../../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import CssImage from '../../Common/CssImage';
import { EntityEditorContext, EntityEditorContextType, PixelVector } from '../EntityEditorTypes';

interface SpriteProps {
  animate: boolean
  frames: number
  currentAnimationFrame: number
  displacement: PixelVector
  highlighted: boolean
  images: string[]
  index: number
  palette: string
  flipHorizontally: boolean
  flipVertically: boolean
  transparent: boolean
  canScale: boolean
}

export default function Sprite(props: SpriteProps): React.JSX.Element {
  const { state, setState } = useContext(EntityEditorContext) as EntityEditorContextType;
  const { services } = useContext(EditorsContext) as EditorsContextType;
  const {
    animate,
    frames,
    canScale,
    currentAnimationFrame,
    displacement,
    highlighted,
    index,
    images,
    palette,
    flipHorizontally,
    flipVertically,
    transparent,
  } = props;
  const [imageData, setImageData] = useState<ImageData[]>([]);
  const [height, setHeight] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [error, setError] = useState<string>();

  const isMultiFileAnimation = images.length > 1;

  const setImageError = (e: string): void => {
    setHeight(32);
    setWidth(32);
    setError(e);
  };

  const getData = async () => {
    let allImageData: ImageData[] = [];

    if (images.length) {
      await Promise.all(images.map(async (image, i) => {
        await services.workspaceService.ready;
        const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;
        const imageUri = workspaceRootUri.resolve(image);
        if (await services.fileService.exists(imageUri)) {
          const imageFileContent = await services.fileService.readFile(imageUri);
          const singleImageData = await window.electronVesCore.parsePng(imageFileContent);
          if (singleImageData) {
            if (singleImageData.colorType !== 3) {
              setImageError('wrong color type');
            } else {
              allImageData = [
                ...allImageData.slice(0, i),
                singleImageData,
                ...allImageData.slice(i),
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
      }));
    } else {
      setImageError('no file selected');
    }

    if (allImageData.length) {
      setError(undefined);
    }
    setImageData(allImageData);
  };

  const getTransform = () => {
    const t: string[] = [];
    if (flipHorizontally) {
      t.push('scaleX(-1)');
    }
    if (flipVertically) {
      t.push('scaleY(-1)');
    }
    if (!canScale && displacement.parallax !== 0) {
      // compensate for scaling due to perspective
      t.push(`scale(${1 + (displacement.parallax / state.preview.projectionDepth)})`);
    }

    return (t.join(' '));
  };

  useEffect(() => {
    getData();
  }, [
    height,
    images.length,
    width,
  ]);

  const currentPixelData = animate && isMultiFileAnimation
    ? imageData[currentAnimationFrame] ? imageData[currentAnimationFrame].pixelData : undefined
    : imageData[0] ? imageData[0].pixelData : undefined;

  const baseZIndex = highlighted ? 999999999 : 100000;

  return (
    <div
      className={error ? 'sprite-error' : ''}
      title={error ? error : ''}
      style={{
        boxSizing: 'border-box',
        cursor: 'pointer',
        height: height / (isMultiFileAnimation ? 1 : frames ?? 1),
        opacity: transparent ? .5 : 1,
        outline: highlighted ? '1px solid green' : undefined,
        overflow: 'hidden',
        position: 'absolute',
        transform: getTransform(),
        translate: `${displacement.x}px ${displacement.y}px ${-1 * displacement.parallax}px`,
        width: width,
        zIndex: baseZIndex + (displacement.z !== 0 ? -displacement.z : 0),
      }}
      onClick={() => setState({ currentComponent: `sprites-${index}` })}
    >
      {!error && imageData.length > 0 &&
        <div style={{
          position: 'relative',
          top: animate && !isMultiFileAnimation
            ? (height / (frames ?? 1) * currentAnimationFrame * -1)
            : 0
        }}>
          {currentPixelData &&
            <CssImage
              height={height}
              palette={palette}
              pixelData={currentPixelData}
              width={width}
            />
          }
        </div>
      }
    </div>
  );
}
