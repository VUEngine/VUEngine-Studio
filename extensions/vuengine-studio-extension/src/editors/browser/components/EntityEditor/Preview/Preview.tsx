import React, { useContext, useEffect, useState } from 'react';
import { ColorMode, PALETTE_COLORS } from '../../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../../../../editors/browser/ves-editors-types';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import BoxCollider from './Colliders/BoxCollider';
import {
  AnimationData,
  EntityEditorContext,
  EntityEditorContextType,
  MAX_PREVIEW_SPRITE_ZOOM,
  MIN_PREVIEW_SPRITE_ZOOM,
  WHEEL_SENSITIVITY,
} from '../EntityEditorTypes';
import Sprite from './Sprite';
import { nls } from '@theia/core';
import PreviewOptions from './PreviewOptions';
import { BgmapMode, ColliderType, Transparency } from '../../Common/VUEngineTypes';
import BallCollider from './Colliders/BallCollider';
import LineFieldCollider from './Colliders/LinefieldCollider';

export default function Preview(): React.JSX.Element {
  const { data, state, setState } = useContext(EntityEditorContext) as EntityEditorContextType;
  const { services } = useContext(EditorsContext) as EditorsContextType;
  const [currentAnimationStep, setCurrentAnimationStep] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
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

  const setAnimationInterval = () => {
    if (animate) {
      timer = setInterval(() => {
        setCurrentAnimationStep(prevAnimationStep =>
          prevAnimationStep + 1 < (animation?.frames?.length || 1) ? prevAnimationStep + 1 : 0
        );
      },
        frameMultiplicator * 20 * (animation?.cycles || 8)
      );
    }
  };

  const onWheel = (e: React.WheelEvent): void => {
    if (e.ctrlKey) {
      let zoom = Math.round((state.preview.zoom - e.deltaY / WHEEL_SENSITIVITY) * 100) / 100;

      if (zoom > MAX_PREVIEW_SPRITE_ZOOM) {
        zoom = MAX_PREVIEW_SPRITE_ZOOM;
      } else if (zoom < MIN_PREVIEW_SPRITE_ZOOM) {
        zoom = MIN_PREVIEW_SPRITE_ZOOM;
      }

      setZoom(zoom);
    }
  };

  const setZoom = (zoom: number): void => {
    setState({
      preview: {
        ...state.preview,
        zoom,
      }
    });
  };

  const onMouseMove = (e: React.MouseEvent): void => {
    if (isDragging) {
      setOffsetX(offsetX + e.movementX / state.preview.zoom);
      setOffsetY(offsetY + e.movementY / state.preview.zoom);
    }
  };

  const center = (): void => {
    setOffsetX(0);
    setOffsetY(0);
  };

  useEffect(() => {
    setAnimationInterval();
    return () => clearInterval(timer);
  }, [
    animate,
    animation,
  ]);

  return <div
    className={`preview-container${isDragging ? ' dragging' : ''}`}
    onClick={() => setState({ currentComponent: '' })}
    onMouseDown={() => setIsDragging(true)}
    onMouseUp={() => setIsDragging(false)}
    onMouseLeave={() => setIsDragging(false)}
    onMouseMove={onMouseMove}
    onWheel={onWheel}
  >
    <PreviewOptions
      enableBackground={false}
      zoom={state.preview.zoom}
      setZoom={setZoom}
      minZoom={MIN_PREVIEW_SPRITE_ZOOM}
      maxZoom={MAX_PREVIEW_SPRITE_ZOOM}
      zoomStep={0.51}
      roundZoomSteps
      center={center}
    />
    {animate &&
      <div className='current-frame'>
        {nls.localize('vuengine/entityEditor/frame', 'Frame')} {currentAnimationStep + 1}
      </div>
    }
    <div
      className="preview-container-world"
      style={{
        background: state.preview.backgroundColor > -1 ? PALETTE_COLORS[ColorMode.Default][state.preview.backgroundColor] : undefined,
        perspective: `${state.preview.projectionDepth}px`,
        zoom: state.preview.zoom,
        translate: `${offsetX}px ${offsetY}px`,
      }}
    >
      {state.preview.sprites && data.components?.sprites?.map((sprite, i) =>
        <Sprite
          key={`preview-sprite-${i}`}
          animate={animate}
          displacement={sprite.displacement}
          frames={data.animations?.totalFrames || 1}
          canScale={sprite.bgmapMode === BgmapMode.Affine}
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
          case ColliderType.Ball:
            return <BallCollider
              index={i}
              highlighted={state.currentComponent === `colliders-${i}`}
              size={collider.pixelSize}
              displacement={collider.displacement}
              rotation={collider.rotation}
              scale={collider.scale}
            />;
          case ColliderType.Box:
          case ColliderType.InverseBox:
            return <BoxCollider
              index={i}
              highlighted={state.currentComponent === `colliders-${i}`}
              size={collider.pixelSize}
              displacement={collider.displacement}
              rotation={collider.rotation}
              scale={collider.scale}
            />;
          case ColliderType.LineField:
            return <LineFieldCollider
              index={i}
              highlighted={state.currentComponent === `colliders-${i}`}
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
