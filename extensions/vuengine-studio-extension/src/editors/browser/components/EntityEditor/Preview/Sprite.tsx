import React, { useContext, useEffect, useState } from 'react';
import { ImageData } from '../../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import CssImage from '../../Common/CssImage';
import { Displacement } from '../EntityEditorTypes';

interface SpriteProps {
  animate: boolean;
  frames: number;
  currentAnimationFrame: number
  displacement: Displacement;
  highlighted: boolean;
  images: string[];
  palette: string
  zoom: number;
  flipHorizontally: boolean
  flipVertically: boolean
  transparent: boolean
}

export default function Sprite(props: SpriteProps): React.JSX.Element {
  const { services } = useContext(EditorsContext) as EditorsContextType;
  const {
    animate,
    frames,
    currentAnimationFrame,
    displacement,
    highlighted,
    images,
    palette,
    zoom,
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
    const allImageData: ImageData[] = [];

    if (images.length) {
      await Promise.all(images.map(async (image, index) => {
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
              allImageData[index] = singleImageData;
              setHeight(height || singleImageData.height);
              setWidth(width || singleImageData.width);
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

    setImageData(allImageData);
  };

  useEffect(() => {
    getData();
  }, [
    height,
    images,
    width,
  ]);

  const transforms: string[] = [];
  if (flipHorizontally) {
    transforms.push('scaleX(-1)');
  }
  if (flipVertically) {
    transforms.push('scaleY(-1)');
  }

  const currentPixelData = animate && isMultiFileAnimation
    ? imageData[currentAnimationFrame] ? imageData[currentAnimationFrame].pixelData : undefined
    : imageData[0] ? imageData[0].pixelData : undefined;

  const baseZIndex = highlighted ? 999999999 : 100000;

  return (
    <>
      <div
        className={error ? 'sprite-error' : ''}
        title={error ? error : ''}
        style={{
          boxSizing: 'border-box',
          height: height * zoom / (isMultiFileAnimation ? 1 : frames || 1),
          marginBottom: displacement.y < 0 ? -displacement.y * zoom * 2 : 0,
          marginLeft: displacement.x > 0 ? displacement.x * zoom * 2 : 0,
          marginRight: displacement.x < 0 ? -displacement.x * zoom * 2 : 0,
          marginTop: displacement.y > 0 ? displacement.y * zoom * 2 : 0,
          opacity: transparent ? .5 : 1,
          outline: highlighted ? '1px solid green' : undefined,
          overflow: 'hidden',
          position: 'absolute',
          transform: transforms.length ? transforms.join(' ') : undefined,
          width: width * zoom,
          zIndex: baseZIndex + (displacement.z !== 0 ? -displacement.z : 0),
        }}
      >
        {!error && imageData.length > 0 &&
          <div style={{
            position: 'relative',
            top: animate && !isMultiFileAnimation
              ? (height * zoom / (frames || 1) * currentAnimationFrame * -1)
              : 0
          }}>
            {currentPixelData &&
              <CssImage
                height={height}
                palette={palette}
                pixelData={currentPixelData}
                pixelSize={zoom}
                width={width}
              />
            }
          </div>
        }
      </div>
    </>
  );
}
