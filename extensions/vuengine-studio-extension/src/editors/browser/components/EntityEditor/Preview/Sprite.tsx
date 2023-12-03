import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import React, { useEffect, useState } from 'react';
import { ImageData } from '../../../../../core/browser/ves-common-types';
import CssImage from '../../Common/CssImage';
import { Displacement } from '../EntityEditorTypes';

interface SpriteProps {
  animate: boolean;
  frames: number;
  displacement: Displacement;
  imagePath: string;
  fileService: FileService;
  palette: string
  workspaceService: WorkspaceService;
  zoom: number;
}

export default function Sprite(props: SpriteProps): React.JSX.Element {
  const { fileService, workspaceService } = props;
  const { animate, frames, displacement, imagePath, palette, zoom } = props;
  const [currentAnimationFrame, setCurrentAnimationFrame] = useState<number>(0);
  const [imageData, setImageData] = useState<ImageData>();
  const [height, setHeight] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [error, setError] = useState<string>();
  let timer: NodeJS.Timeout | undefined;

  const getData = async () => {
    await workspaceService.ready;
    const workspaceRootUri = workspaceService.tryGetRoots()[0]?.resource;
    const imageUri = workspaceRootUri.resolve(imagePath);
    if (await fileService.exists(imageUri)) {
      const imageFileContent = await fileService.readFile(imageUri);
      const img = await window.electronVesCore.parsePng(imageFileContent);
      if (img) {
        if (img.colorType !== 3) {
          setError('wrong color type');
        } else {
          console.log('img', img);
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

  const updateAnimationFrame = () => {
    timer = !timer
      ? setInterval(() => {
        setCurrentAnimationFrame(prevAnimationFrame => prevAnimationFrame + 1 < frames ? prevAnimationFrame + 1 : 0);
      }, 1000)
      : undefined;
  };

  useEffect(() => {
    getData();
    updateAnimationFrame();
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {animate && <div className='current-frame'>
        {currentAnimationFrame + 1}
      </div>}
      <div
        className={error ? 'sprite-error' : ''}
        style={{
          boxSizing: 'border-box',
          height: height * zoom / (frames || 1),
          marginBottom: displacement.y < 0 ? -displacement.y * zoom : 0,
          marginLeft: displacement.x > 0 ? displacement.x * zoom : 0,
          marginRight: displacement.x < 0 ? -displacement.x * zoom : 0,
          marginTop: displacement.y > 0 ? displacement.y * zoom : 0,
          overflow: 'hidden',
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
