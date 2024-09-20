import { CornersOut, Square } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { useContext } from 'react';
import ColorSelector from '../../Common/ColorSelector';
import ZoomControls from '../../Common/Controls/ZoomControls';
import HContainer from '../../Common/HContainer';
import { clamp } from '../../Common/Utils';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';

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
  const {
    enableBackground, zoom, setZoom, minZoom, maxZoom, zoomStep, roundZoomSteps, center,
  } = props;
  const {
    previewAnaglyph, setPreviewAnaglyph,
    previewBackgroundColor, setPreviewBackgroundColor,
  } = useContext(EntityEditorContext) as EntityEditorContextType;

  const setBackgroundColor = (backgroundColor: number) =>
    setPreviewBackgroundColor(clamp(backgroundColor, -1, 3));

  const toggleAnaglyph = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewAnaglyph(previousValue => !previousValue);
  };

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
    <div className='controls-container'>
      <HContainer gap={15}>
        <ZoomControls
          zoom={zoom}
          defaultZoom={1}
          min={minZoom}
          max={maxZoom}
          step={zoomStep}
          roundZoomSteps={roundZoomSteps ?? false}
          applyZoom={applyZoom}
        />
        <button
          className='theia-button secondary controls-button'
          onClick={e => { e.stopPropagation(); center(); }}
          title={nls.localize('vuengine/editors/centerView', 'Center View')}
        >
          <CornersOut size={20} />
        </button>
      </HContainer>
      <HContainer gap={15}>
        <button
          className='theia-button secondary controls-button'
          onClick={toggleAnaglyph}
          style={{
            paddingLeft: 4,
            paddingRight: 4,
          }}
          title={`${nls.localize('vuengine/editors/anaglyph', 'Anaglyph')}: ${previewAnaglyph
            ? nls.localize('vuengine/editors/enabled', 'Enabled')
            : nls.localize('vuengine/editors/disabled', 'Disabled')}`}
        >
          {previewAnaglyph
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
        {enableBackground &&
          <VContainer>
            <ColorSelector
              color={previewBackgroundColor}
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
                value={previewPalettes[i]}
                updateValue={newValue => {
                  const updatedPalettes = previewPalettes;
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
