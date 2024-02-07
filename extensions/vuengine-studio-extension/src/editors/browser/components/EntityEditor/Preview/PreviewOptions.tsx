import { nls } from '@theia/core';
import React, { useContext } from 'react';
import ColorSelector from '../../Common/ColorSelector';
import HContainer from '../../Common/HContainer';
import Palette from '../../Common/Palette';
import VContainer from '../../Common/VContainer';
import {
  EntityEditorContext,
  EntityEditorContextType
} from '../EntityEditorTypes';

export default function PreviewOptions(): React.JSX.Element {
  const { state, setState, data } = useContext(EntityEditorContext) as EntityEditorContextType;

  const animate = (state.preview.animations && data.components?.animations?.length > 0) || state.preview.currentAnimation > -1;

  const setBooleanStateProperty = (property: string, checked: boolean) =>
    setState({
      preview: {
        ...state.preview,
        [property]: checked,
      },
    });

  const setBackgroundColor = (backgroundColor: number) =>
    setState({
      preview: {
        ...state.preview,
        backgroundColor: Math.min(Math.max(backgroundColor, -1), 3),
      },
    });

  return (
    <VContainer gap={15}>
      <VContainer>
        <label>
          {nls.localize('vuengine/entityEditor/zoom', 'Zoom')}
        </label>
        <HContainer>
          <input
            type="range"
            value={state.preview.zoom}
            max={10}
            min={1}
            onChange={e =>
              setState({
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
          {nls.localize('vuengine/entityEditor/options', 'Options')}
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.preview.sprites && data.components?.sprites?.length > 0}
            disabled={!data.components?.sprites?.length}
            onChange={e => setBooleanStateProperty('sprites', e.target.checked)}
          />
          {nls.localize('vuengine/entityEditor/showSprites', 'Show Sprites')}
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.preview.wireframes && data.components?.wireframes?.length > 0}
            disabled={!data.components?.wireframes?.length}
            onChange={e => setBooleanStateProperty('wireframes', e.target.checked)}
          />
          Show Wireframes
        </label>
        <label>
          <input
            type="checkbox"
            checked={state.preview.colliders}
            onChange={e =>
              setBooleanStateProperty('colliders', e.target.checked)
            }
          />
          Show Colliders
        </label>
        <label>
          <input
            type="checkbox"
            checked={animate}
            disabled={!data.components?.animations?.length}
            onChange={e =>
              setBooleanStateProperty('animations', e.target.checked)
            }
          />
          {nls.localize('vuengine/entityEditor/showAnimations', 'Show Animations')}
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
        <label>
          {nls.localize('vuengine/entityEditor/background', 'Background')}
        </label>
        <ColorSelector
          color={state.preview.backgroundColor}
          updateColor={setBackgroundColor}
          includeTransparent
        />
      </VContainer>
      <VContainer>
        <label>
          {nls.localize('vuengine/entityEditor/palettes', 'Palettes')}
        </label>
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
