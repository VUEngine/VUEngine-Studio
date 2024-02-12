import React, { useContext } from 'react';
import ColorSelector from '../../Common/ColorSelector';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import {
  EntityEditorContext,
  EntityEditorContextType,
  MAX_PREVIEW_ZOOM,
  MIN_PREVIEW_ZOOM
} from '../EntityEditorTypes';

export default function PreviewOptions(): React.JSX.Element {
  const { state, setState } = useContext(EntityEditorContext) as EntityEditorContextType;

  const setBackgroundColor = (backgroundColor: number) =>
    setState({
      preview: {
        ...state.preview,
        backgroundColor: Math.min(Math.max(backgroundColor, -1), 3),
      },
    });

  const setZoom = (zoom: number) => {
    if (zoom < MIN_PREVIEW_ZOOM) {
      zoom = MIN_PREVIEW_ZOOM;
    }
    if (zoom > MAX_PREVIEW_ZOOM) {
      zoom = MAX_PREVIEW_ZOOM;
    }
    setState({
      preview: {
        ...state.preview,
        zoom,
      },
    });
  };

  return (
    <VContainer alignItems='end' gap={15}>
      <HContainer>
        <button
          className='theia-button secondary'
          disabled={state.preview.zoom === MIN_PREVIEW_ZOOM}
          onClick={() => setZoom(state.preview.zoom - 1)}
        >
          <i className='codicon codicon-zoom-out' />
        </button>
        <input
          type='text'
          className='theia-input'
          style={{ padding: 0, textAlign: 'center', width: 40 }}
          value={state.preview.zoom}
          disabled
        />
        <button
          className='theia-button secondary'
          disabled={state.preview.zoom === MAX_PREVIEW_ZOOM}
          onClick={() => setZoom(state.preview.zoom + 1)}
        >
          <i className='codicon codicon-zoom-in' />
        </button>
      </HContainer>
      <VContainer>
        <ColorSelector
          color={state.preview.backgroundColor}
          updateColor={setBackgroundColor}
          includeTransparent
        />
      </VContainer>
      {/*
      <HContainer>
        <input
          type="checkbox"
          checked={state.preview.anaglyph}
          onChange={e =>
            setBooleanStateProperty('anaglyph', e.target.checked)
          }
        />
        Anaglyph
      </HContainer>
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
      */}
    </VContainer>
  );
}
