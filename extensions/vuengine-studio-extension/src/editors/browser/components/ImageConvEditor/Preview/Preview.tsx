import { nls } from '@theia/core';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import {
  ImageConvEditorContext,
  ImageConvEditorContextType,
} from '../ImageConvEditorTypes';
import Sprite from '../../EntityEditor/Preview/Sprite';
import Palette from '../../Common/Palette';

interface PreviewProps {
  fileService: FileService;
  workspaceService: WorkspaceService;
}

export default function Preview(props: PreviewProps): React.JSX.Element {
  const { fileService, workspaceService } = props;
  const { imageConvData } = useContext(ImageConvEditorContext) as ImageConvEditorContextType;
  const { state, setState } = useContext(
    ImageConvEditorContext
  ) as ImageConvEditorContextType;

  const setBooleanStateProperty = (property: string, checked: boolean) =>
    setState({
      ...state,
      preview: {
        ...state.preview,
        [property]: checked,
      },
    });

  return (
    <VContainer gap={10}>
      <div className="preview-container">
        {imageConvData.files && <Sprite
          animate={imageConvData.animation.isAnimation && state.preview.animations}
          frames={imageConvData.animation.isAnimation ? imageConvData.animation.frames : 1}
          displacement={{
            x: 0,
            y: 0,
            z: 0,
            parallax: 0,
          }}
          imagePath={imageConvData.files[0]}
          palette={state.preview.palette}
          zoom={state.preview.zoom}
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
            value={state.preview.zoom}
            max={10}
            min={1}
            onChange={e =>
              setState({
                ...state,
                preview: {
                  ...state.preview,
                  zoom: parseInt(e.target.value),
                },
              })
            }
          />
          <div style={{ minWidth: 24, textAlign: 'right', width: 24 }}>
            {state.preview.zoom}
          </div>
        </HContainer>
      </VContainer>
      <VContainer>
        <label>
          {nls.localizeByDefault('Options')}
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.preview.animations}
            onChange={e =>
              setBooleanStateProperty('animations', e.target.checked)
            }
          />
          Show Animations
        </label>
      </VContainer>
      <VContainer>
        <label>Palette</label>
        <Palette
          value={state.preview.palette}
          updateValue={newValue => {
            setState({
              ...state,
              preview: {
                ...state.preview,
                palette: newValue,
              },
            });
          }}
        />
      </VContainer>
    </VContainer>
  );
}
