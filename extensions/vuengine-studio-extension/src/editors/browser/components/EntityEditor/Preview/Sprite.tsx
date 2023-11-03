import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import React, { useEffect, useState } from 'react';
import { ImageData } from '../../../../../core/browser/ves-common-types';
import CssImage from '../../Common/CssImage';
import { Displacement } from '../EntityEditorTypes';

interface SpriteProps {
  displacement: Displacement;
  height: number;
  imagePath: string;
  fileService: FileService;
  workspaceService: WorkspaceService;
  width: number;
  zoom: number;
}

export default function Sprite(props: SpriteProps): React.JSX.Element {
  const { fileService, workspaceService } = props;
  const { displacement, height, imagePath, width, zoom } = props;
  const [imageData, setImageData] = useState<ImageData>();
  const [error, setError] = useState<string>();

  useEffect(() => {
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
            setImageData(img);
          }
        } else {
          setError('could not parse image');
        }
      } else {
        setError('file not found');
      }
    };
    getData();
  }, []);

  return (
    <>
      <div
        className={error ? 'sprite-error' : ''}
        style={{
          boxSizing: 'border-box',
          height: height * zoom,
          marginBottom: displacement.y < 0 ? -displacement.y * zoom : 0,
          marginLeft: displacement.x > 0 ? displacement.x * zoom : 0,
          marginRight: displacement.x < 0 ? -displacement.x * zoom : 0,
          marginTop: displacement.y > 0 ? displacement.y * zoom : 0,
          width: width * zoom,
          zIndex: 100000 + (displacement.z !== 0 ? -displacement.z : 0),
        }}
      >
        {imageData && (
          <CssImage
            height={height}
            palette={[0, 2, 3]}
            pixelData={imageData.pixelData}
            pixelSize={zoom}
            width={width}
          />
        )}
      </div>
    </>
  );
}
