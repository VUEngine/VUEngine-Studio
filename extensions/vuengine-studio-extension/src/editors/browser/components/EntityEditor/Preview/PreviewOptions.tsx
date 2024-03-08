import React, { useContext } from 'react';
import ColorSelector from '../../Common/ColorSelector';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import { CornersOut } from '@phosphor-icons/react';
import { nls } from '@theia/core';

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

  /*
  const toggleAnaglyph = () =>
    setState({
      preview: {
        ...state.preview,
        anaglyph: !state.preview.anaglyph,
      },
    });
  */

  const applyZoom = (e: React.MouseEvent, z: number) => {
    e.stopPropagation();
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
      <HContainer gap={15}>
        <HContainer gap={3}>
          <button
            className='theia-button secondary'
            disabled={zoom === minZoom}
            onClick={e => applyZoom(e, roundZoomSteps ? Math.round(zoom - zoomStep) : zoom - zoomStep)}
            title={nls.localize('vuengine/editors/zoomOut', 'Zoom Out')}
          >
            <i className='codicon codicon-zoom-out' />
          </button>
          <input
            type='text'
            className='theia-input'
            value={Math.round(zoom * 100) / 100}
            disabled
            title={nls.localize('vuengine/editors/currentZoomFactor', 'Current Zoom Factor')}
          />
          <button
            className='theia-button secondary'
            disabled={zoom === maxZoom}
            onClick={e => applyZoom(e, roundZoomSteps ? Math.round(zoom + zoomStep) : zoom + zoomStep)}
            title={nls.localize('vuengine/editors/zoomIn', 'Zoom In')}
          >
            <i className='codicon codicon-zoom-in' />
          </button>
        </HContainer>
        <button
          className='theia-button secondary'
          onClick={e => { e.stopPropagation(); center(); }}
          title={nls.localize('vuengine/editors/centerView', 'Center View')}
        >
          <CornersOut size={20} />
        </button>
      </HContainer>
      <HContainer gap={15}>
        {/*
        <button
          className='theia-button secondary'
          onClick={toggleAnaglyph}
          style={{
            paddingLeft: 4,
            paddingRight: 4,
          }}
          title={`${nls.localize('vuengine/editors/anaglyph', 'Anaglyph')}: ${state.preview.anaglyph
            ? nls.localize('vuengine/editors/enabled', 'Enabled')
            : nls.localize('vuengine/editors/disabled', 'Disabled')}`}
        >
          {state.preview.anaglyph
            ? <>
              <Square size={16} weight="fill" color="red" />
              <Square size={16} weight="fill" color="blue" />
            </>
            : <>
              <Square size={16} />
              <Square size={16} />
            </>
          }
        </button>
        */}
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
      </HContainer>
    </div>
  );
}
