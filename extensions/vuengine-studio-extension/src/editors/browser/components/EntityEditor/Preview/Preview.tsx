import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import React, { useContext } from 'react';
import { VesCommonService } from '../../../../../core/browser/ves-common-service';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import {
  EntityEditorContext,
  EntityEditorContextType,
} from '../EntityEditorTypes';
import Sprite from './Sprite';
import Palette from '../../Common/Palette';

interface PreviewProps {
  vesCommonService: VesCommonService;
  fileService: FileService;
  workspaceService: WorkspaceService;
}

export default function Preview(props: PreviewProps): React.JSX.Element {
  const { fileService, vesCommonService, workspaceService } = props;
  const { state, setState } = useContext(
    EntityEditorContext
  ) as EntityEditorContextType;

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
        <Sprite
          displacement={{
            x: 0,
            y: 0,
            z: 10,
            parallax: 0,
          }}
          height={16}
          imagePath="assets/images/Drone/Drone/Drone.png"
          width={16}
          zoom={state.preview.zoom}
          fileService={fileService}
          vesCommonService={vesCommonService}
          workspaceService={workspaceService}
        />
      </div>
      <VContainer>
        <label>Zoom</label>
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
        <label>Options</label>
        <label>
          <input
            type="checkbox"
            checked={state.preview.sprites}
            onChange={e => setBooleanStateProperty('sprites', e.target.checked)}
          />
          Show Sprites
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.preview.meshes}
            onChange={e => setBooleanStateProperty('meshes', e.target.checked)}
          />
          Show Meshes
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.preview.collisions}
            onChange={e =>
              setBooleanStateProperty('collisions', e.target.checked)
            }
          />
          Show Collisions
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
        <label>
          <input
            type="checkbox"
            checked={state.preview.anaglyph}
            onChange={e =>
              setBooleanStateProperty('anaglyph', e.target.checked)
            }
          />
          Anaglyph Display Mode
        </label>
      </VContainer>
      <VContainer>
        <label>BGMap Palettes</label>
        {[...Array(4)].map((h, index) => (
          <HContainer>
            {index}
            <Palette
              value={state.preview.palettes[index]}
              updateValue={newValue => {
                const updatedPalettes = state.preview.palettes;
                updatedPalettes[index] = newValue;
                setState({
                  ...state,
                  preview: {
                    ...state.preview,
                    palettes: updatedPalettes,
                  },
                });
              }}
            />
          </HContainer>
        ))}
      </VContainer>
    </VContainer>
  );
}
