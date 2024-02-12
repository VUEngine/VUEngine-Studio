import React, { useContext, useEffect, useState } from 'react';
import { ColorMode, PALETTE_COLORS } from '../../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../../../../editors/browser/ves-editors-types';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import BoxCollider from './Colliders/BoxCollider';
import {
  AnimationData,
  BgmapMode,
  ColliderType,
  EntityEditorContext,
  EntityEditorContextType,
  Transparency,
} from '../EntityEditorTypes';
import Sprite from './Sprite';
import { nls } from '@theia/core';

export default function Preview(): React.JSX.Element {
  const { state, data } = useContext(EntityEditorContext) as EntityEditorContextType;
  const { services } = useContext(EditorsContext) as EditorsContextType;
  const [currentAnimationStep, setCurrentAnimationStep] = useState<number>(0);
  let timer: NodeJS.Timeout | undefined;

  const engineConfig = services.vesProjectService.getProjectDataItemById(ProjectContributor.Project, 'EngineConfig');
  // @ts-ignore
  const frameMultiplicator = engineConfig && engineConfig.frameRate?.frameCycle ? engineConfig.frameRate.frameCycle + 1 : 1;
  const animate = state.currentComponent?.startsWith('animations-');
  const currentAnimation = state.currentComponent?.startsWith('animations-')
    ? parseInt(state.currentComponent.split('animations-')[1])
    : data.animations.default;
  const animation: AnimationData | undefined = data.components?.animations
    ? data.components?.animations[currentAnimation]
    : undefined;

  const updateAnimationStep = () => {
    timer = !timer
      ? setInterval(() => {
        setCurrentAnimationStep(prevAnimationStep =>
          prevAnimationStep + 1 < (animation?.frames?.length || 1) ? prevAnimationStep + 1 : 0
        );
      }, frameMultiplicator * 20 * (animation?.cycles || 8))
      : undefined;
  };

  useEffect(() => {
    clearInterval(timer);
    updateAnimationStep();
    return () => clearInterval(timer);
  }, [
    animation
  ]);

  return <div className='preview-container'>
    {animate &&
      <div className='current-frame'>
        {nls.localize('vuengine/entityEditor/frame', 'Frame')} {currentAnimationStep + 1}
      </div>
    }
    <div
      className="preview-container-world"
      style={{
        background: state.preview.backgroundColor > -1 ? PALETTE_COLORS[ColorMode.Default][state.preview.backgroundColor] : undefined,
        perspective: state.preview.projectionDepth + 'px',
        zoom: state.preview.zoom,
      }}
    >
      {state.preview.sprites && data.components?.sprites?.map((sprite, i) =>
        <Sprite
          key={`preview-sprite-${i}`}
          animate={animate}
          displacement={sprite.displacement}
          frames={data.animations?.totalFrames || 1}
          canScale={sprite.bgmapMode === BgmapMode.Affine}
          projectionDepth={state.preview.projectionDepth}
          currentAnimationFrame={animation?.frames[currentAnimationStep - 1] ?? currentAnimationStep}
          highlighted={state.currentComponent === `sprites-${i}`}
          images={sprite.texture.files}
          index={i}
          flipHorizontally={sprite.texture.flip.horizontal}
          flipVertically={sprite.texture.flip.vertical}
          transparent={sprite.transparency !== Transparency.None}
          palette={state.preview.palettes[sprite.texture.palette]}
        />
      )}
      {state.preview.colliders && data.components?.colliders?.map((collider, i) => {
        switch (collider.type) {
          case ColliderType.Box:
            return <BoxCollider
              size={collider.pixelSize}
              displacement={collider.displacement}
              rotation={collider.rotation}
              scale={collider.scale}
            />;

        }
      })}
    </div>
  </div>;
}
