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
  imagePath: string;
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
    imagePath,
    palette,
    zoom,
    flipHorizontally,
    flipVertically,
    transparent,
  } = props;
  const [imageData, setImageData] = useState<ImageData>();
  const [height, setHeight] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [error, setError] = useState<string>();

  const getData = async () => {
    await services.workspaceService.ready;
    const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;
    const imageUri = workspaceRootUri.resolve(imagePath);
    if (await services.fileService.exists(imageUri)) {
      const imageFileContent = await services.fileService.readFile(imageUri);
      const img = await window.electronVesCore.parsePng(imageFileContent);
      if (img) {
        if (img.colorType !== 3) {
          setError('wrong color type');
        } else {
          setImageData(img);
          setHeight(height || img.height);
          setWidth(width || img.width);
        }
      } else {
        setError('could not parse image');
      }
    } else {
      setError('file not found');
    }
  };

  useEffect(() => {
    getData();
  }, [
    height,
    imagePath,
    width,
  ]);

  const transforms: string[] = [];
  if (flipHorizontally) {
    transforms.push('scaleX(-1)');
  }
  if (flipVertically) {
    transforms.push('scaleY(-1)');
  }

  return (
    <>
      <div
        className={error ? 'sprite-error' : ''}
        style={{
          boxSizing: 'border-box',
          height: height * zoom / (frames || 1),
          marginBottom: displacement.y < 0 ? -displacement.y * zoom * 2 : 0,
          marginLeft: displacement.x > 0 ? displacement.x * zoom * 2 : 0,
          marginRight: displacement.x < 0 ? -displacement.x * zoom * 2 : 0,
          marginTop: displacement.y > 0 ? displacement.y * zoom * 2 : 0,
          opacity: transparent ? .5 : 1,
          overflow: 'hidden',
          position: 'absolute',
          transform: transforms.length ? transforms.join(' ') : undefined,
          width: width * zoom,
          zIndex: 100000 + (displacement.z !== 0 ? -displacement.z : 0),
        }}
      >
        {imageData &&
          <div style={{
            position: 'relative',
            top: animate
              ? (height * zoom / (frames || 1) * currentAnimationFrame * -1)
              : 0
          }}>
            <CssImage
              height={height}
              palette={palette}
              pixelData={imageData.pixelData}
              pixelSize={zoom}
              width={width}
            />
          </div>
        }
      </div>
    </>
  );
}
