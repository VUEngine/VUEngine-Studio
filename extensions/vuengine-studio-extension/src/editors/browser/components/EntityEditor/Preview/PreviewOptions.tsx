import React, { useContext } from 'react';
import ColorSelector from '../../Common/ColorSelector';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import { CornersOut } from '@phosphor-icons/react';

interface PreviewOptionsProps {
  enableBackground: boolean
  zoom: number
  setZoom: (zoom: number) => void
  minZoom: number
  maxZoom: number
  zoomStep: number
  roundZoomSteps?: boolean
  center: () => void
}

export default function PreviewOptions(props: PreviewOptionsProps): React.JSX.Element {
  const { enableBackground, zoom, setZoom, minZoom, maxZoom, zoomStep, roundZoomSteps, center } = props;
  const { state, setState } = useContext(EntityEditorContext) as EntityEditorContextType;

  const setBackgroundColor = (backgroundColor: number) =>
    setState({
      preview: {
        ...state.preview,
        backgroundColor: Math.min(Math.max(backgroundColor, -1), 3),
      },
    });

  const applyZoom = (z: number) => {
    if (setZoom) {
      if (z < minZoom) {
        z = minZoom;
      } else if (z > maxZoom) {
        z = maxZoom;
      }
      setZoom(z);
    }
  };

  return (
    <div className='preview-options'>
      <HContainer gap={3}>
        <button
          className='theia-button secondary'
          disabled={zoom === minZoom}
          onClick={() => applyZoom(roundZoomSteps ? Math.round(zoom - zoomStep) : zoom - zoomStep)}
        >
          <i className='codicon codicon-zoom-out' />
        </button>
        <input
          type='text'
          className='theia-input'
          value={Math.round(zoom * 100) / 100}
          disabled
        />
        <button
          className='theia-button secondary'
          disabled={zoom === maxZoom}
          onClick={() => applyZoom(roundZoomSteps ? Math.round(zoom + zoomStep) : zoom + zoomStep)}
        >
          <i className='codicon codicon-zoom-in' />
        </button>
      </HContainer>
      <button
        className='theia-button secondary'
        onClick={center}
      >
        <CornersOut size={20} />
      </button>
      {enableBackground &&
        <VContainer>
          <ColorSelector
            color={state.preview.backgroundColor}
            updateColor={setBackgroundColor}
            includeTransparent
          />
        </VContainer>
      }
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
    </div>
  );
}
