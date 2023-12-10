import { nls } from '@theia/core';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import React, { useContext, useState } from 'react';
import HContainer from '../../Common/HContainer';
import Palette from '../../Common/Palette';
import VContainer from '../../Common/VContainer';
import Sprite from '../../EntityEditor/Preview/Sprite';
import {
  ImageConvEditorContext,
  ImageConvEditorContextType,
} from '../ImageConvEditorTypes';

interface PreviewProps {
  fileService: FileService;
  workspaceService: WorkspaceService;
}

export default function Preview(props: PreviewProps): React.JSX.Element {
  const { fileService, workspaceService } = props;
  const { filesToShow, imageConvData } = useContext(ImageConvEditorContext) as ImageConvEditorContextType;
  const [showAnimations, setShowAnimations] = useState<boolean>(true);
  const [palette, setPalette] = useState<string>('11100100');
  const [zoom, setZoom] = useState<number>(1);

  return (
    <VContainer gap={10}>
      <div className="preview-container">
        {Object.keys(filesToShow).length && <Sprite
          animate={imageConvData.animation.isAnimation && showAnimations}
          frames={imageConvData.animation.isAnimation ? imageConvData.animation.frames : 1}
          displacement={{
            x: 0,
            y: 0,
            z: 0,
            parallax: 0,
          }}
          imagePath={Object.keys(filesToShow)[0]}
          palette={palette}
          zoom={zoom}
          fileService={fileService}
          workspaceService={workspaceService}
        />}
      </div>
      <VContainer>
        <label>
          {nls.localizeByDefault('Zoom')}
        </label>
        <HContainer>
          <input
            type="range"
            value={zoom}
            max={10}
            min={1}
            onChange={e =>
              setZoom(parseInt(e.target.value))
            }
          />
          <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
            {zoom}
          </div>
        </HContainer>
      </VContainer>
      {imageConvData.animation.isAnimation &&
        <VContainer>
          <label>
            {nls.localizeByDefault('Options')}
          </label>
          <label>
            <input
              type="checkbox"
              checked={showAnimations}
              onChange={e =>
                setShowAnimations(e.target.checked)
              }
            />
            Show Animations
          </label>
        </VContainer>}
      <VContainer>
        <label>Palette</label>
        <Palette
          value={palette}
          updateValue={newValue =>
            setPalette(newValue)
          }
        />
      </VContainer>
    </VContainer>
  );
}
