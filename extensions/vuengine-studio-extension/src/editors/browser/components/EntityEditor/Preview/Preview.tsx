import { nls } from '@theia/core';
import React, { useContext, useEffect, useState } from 'react';
import { PALETTE_COLORS } from '../../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../../../../editors/browser/ves-editors-types';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import ColorSelector from '../../Common/ColorSelector';
import HContainer from '../../Common/HContainer';
import Palette from '../../Common/Palette';
import VContainer from '../../Common/VContainer';
import {
  AnimationData,
  EntityEditorContext,
  EntityEditorContextType,
  Transparency,
} from '../EntityEditorTypes';
import Sprite from './Sprite';

export default function Preview(): React.JSX.Element {
  const { state, setState, data } = useContext(EntityEditorContext) as EntityEditorContextType;
  const { services } = useContext(EditorsContext) as EditorsContextType;
  const [currentAnimationStep, setCurrentAnimationStep] = useState<number>(0);
  let timer: NodeJS.Timeout | undefined;

  const engineConfig = services.vesProjectService.getProjectDataItemById(ProjectContributor.Project, 'EngineConfig');
  // @ts-ignore
  const frameMultiplicator = engineConfig && engineConfig.frameRate?.frameCycle ? engineConfig.frameRate.frameCycle + 1 : 1;

  const animate = (state.preview.animations && data.components?.animations?.length > 0) || state.preview.currentAnimation > -1;
  const currentAnimation = state.preview.currentAnimation > -1 ? state.preview.currentAnimation : data.animations.default;
  const animation: AnimationData | undefined = data.components?.animations
    ? data.components?.animations[currentAnimation]
    : undefined;

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

  const updateAnimationStep = () => {
    timer = !timer
      ? setInterval(() => {
        setCurrentAnimationStep(prevAnimationStep =>
          prevAnimationStep + 1 < (animation?.frames?.length || 1) ? prevAnimationStep + 1 : 0
        );
      }, frameMultiplicator * 20 * (animation?.cycles || 8))
      : undefined;
  };

  const showPreview = data.components?.sprites.length /* ||
    data.components?.children.length ||
    data.components?.colliders.length ||
    data.components?.wireframes.length */;

  useEffect(() => {
    clearInterval(timer);
    updateAnimationStep();
    return () => clearInterval(timer);
  }, [
    animation
  ]);

  return (
    <VContainer>
      <VContainer>
        <label>
          {nls.localize('vuengine/entityEditor/preview', 'Preview')}
        </label>
      </VContainer>
      {showPreview
        ? <VContainer gap={15}>
          <div
            className="preview-container"
            style={{ backgroundColor: state.preview.backgroundColor > -1 ? PALETTE_COLORS[state.preview.backgroundColor] : undefined }}
          >
            {animate &&
              <div className='current-frame'>
                <div>
                  {animation?.name
                    ? `"${animation?.name}"`
                    : `Animation ${currentAnimation + 1}`}
                </div>
                <div>
                  {currentAnimationStep + 1}
                </div>
              </div>}
            {state.preview.sprites && data.components?.sprites?.map((s, i) =>
              <Sprite
                key={`preview-sprite-${i}`}
                animate={animate}
                displacement={s.displacement}
                frames={data.animations?.totalFrames || 1}
                currentAnimationFrame={animation?.frames[currentAnimationStep - 1] ?? currentAnimationStep}
                highlighted={state.preview.highlightedSprite === i}
                images={s.texture.files}
                flipHorizontally={s.texture.flip.horizontal}
                flipVertically={s.texture.flip.vertical}
                transparent={s.transparency !== Transparency.None}
                palette={state.preview.palettes[s.texture.palette]}
                zoom={state.preview.zoom}
              />)}
          </div>
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
            {/*
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
            checked={state.preview.colliders && data.colliders?.inGameType !== 'None'}
            disabled={data.colliders?.inGameType === 'None'}
            onChange={e =>
              setBooleanStateProperty('colliders', e.target.checked)
            }
          />
          Show Colliders
        </label>
        */}
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
            {/*
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
        */}
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
        : <>
          {nls.localize('vuengine/entityEditor/noPreviewableComponents', 'No previewable components found.')}
        </>}
    </VContainer>
  );
}
