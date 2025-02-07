import { CornersOut, Square } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import ColorSelector from '../../Common/ColorSelector';
import ZoomControls from '../../Common/Controls/ZoomControls';
import HContainer from '../../Common/Base/HContainer';
import { clamp } from '../../Common/Utils';
import VContainer from '../../Common/Base/VContainer';
import { INPUT_BLOCKING_COMMANDS } from '../ActorEditor';
import { ActorEditorContext, ActorEditorContextType } from '../ActorEditorTypes';

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
  } = useContext(ActorEditorContext) as ActorEditorContextType;
  const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;

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
          title={nls.localize('vuengine/editors/general/centerView', 'Center View')}
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
          title={`${nls.localize('vuengine/editors/general/anaglyph', 'Anaglyph')}: ${previewAnaglyph
            ? nls.localize('vuengine/editors/general/enabled', 'Enabled')
            : nls.localize('vuengine/editors/general/disabled', 'Disabled')}`}
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
              onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
              onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
            />
          </VContainer>
        }
        {/*
        <VContainer>
          <label>
            {nls.localize('vuengine/editors/actor/palettes', 'Palettes')}
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
