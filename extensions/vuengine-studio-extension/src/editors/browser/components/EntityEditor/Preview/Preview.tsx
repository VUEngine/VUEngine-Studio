import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import React, { useContext } from 'react';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import {
  EntityEditorContext,
  EntityEditorContextType,
} from '../EntityEditorTypes';
import Sprite from './Sprite';
import Palette from '../../Common/Palette';

interface PreviewProps {
  fileService: FileService;
  workspaceService: WorkspaceService;
}

export default function Preview(props: PreviewProps): React.JSX.Element {
  const { fileService, workspaceService } = props;
  const { state, setState, data } = useContext(
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
          animate={state.preview.animations && data.animations?.animations?.length > 0}
          displacement={{
            x: 0,
            y: 0,
            z: 10,
            parallax: 0,
          }}
          frames={3}
          imagePath="assets/images/Drone/Drone/Drone.png"
          palette='11100100'
          zoom={state.preview.zoom}
          fileService={fileService}
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
            checked={state.preview.sprites && data.sprites?.sprites?.length > 0}
            disabled={!data.sprites?.sprites?.length}
            onChange={e => setBooleanStateProperty('sprites', e.target.checked)}
          />
          Show Sprites
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.preview.wireframes && data.wireframes?.wireframes?.length > 0}
            disabled={!data.wireframes?.wireframes?.length}
            onChange={e => setBooleanStateProperty('wireframes', e.target.checked)}
          />
          Show Wireframes
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.preview.colliders && data.colliders?.inGameType !== 'None'}
            disabled={data.colliders?.inGameType === 'None'}
            onChange={e =>
              setBooleanStateProperty('colliders', e.target.checked)
            }
          />
          Show Colliders
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.preview.animations && data.animations?.animations?.length > 0}
            disabled={!data.animations?.animations?.length}
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
        {[...Array(4)].map((h, i) => (
          <HContainer key={`preview-palette-${i}`}>
            <div style={{ width: 16 }}>
              {i}
            </div>
            <Palette
              value={state.preview.palettes[i]}
              updateValue={newValue => {
                const updatedPalettes = state.preview.palettes;
                updatedPalettes[i] = newValue;
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
