import { IdentificationCard } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { useContext, useEffect, useState } from 'react';
import { ColorMode, PALETTE_COLORS } from '../../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../../../../editors/browser/ves-editors-types';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import { ColliderType } from '../../Common/VUEngineTypes';
import {
  AnimationData,
  EntityEditorContext,
  EntityEditorContextType,
  MAX_PREVIEW_SPRITE_ZOOM,
  MIN_PREVIEW_SPRITE_ZOOM,
  WHEEL_SENSITIVITY,
} from '../EntityEditorTypes';
import BallCollider from './Colliders/BallCollider';
import BoxCollider from './Colliders/BoxCollider';
import LineFieldCollider from './Colliders/LineFieldCollider';
import PreviewOptions from './PreviewOptions';
import Sprite from './Sprite';
import PreviewWireframe from './Wireframes/PreviewWireframe';

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

  const actualCurrentFrame = animation?.frames?.length
    ? animation?.frames[currentAnimationStep] ?? 0
    : currentAnimationStep;

  const setAnimationInterval = () => {
    if (animate) {
      timer = setInterval(() => {
        setCurrentAnimationStep(prevAnimationStep =>
          prevAnimationStep + 1 < (animation?.frames?.length ?? 1)
            ? prevAnimationStep + 1
            : animation?.loop
              ? 0
              : prevAnimationStep
        );
      },
        frameMultiplicator * 20 * (animation?.cycles ?? 8)
      );
    }
  };

  const clearAnimationInterval = () => {
    clearInterval(timer);
    setCurrentAnimationStep(0);
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

  const hasPreviewableComponents =
    data.components?.children?.length +
    data.components?.colliders?.length +
    data.components?.sprites?.length +
    data.components?.wireframes?.length > 0;

  useEffect(() => {
    setAnimationInterval();
    return () => clearAnimationInterval();
  }, [
    animate,
    animation,
  ]);

  useEffect(() => {
    setState({ currentAnimationStep });
  }, [
    currentAnimationStep,
  ]);

  return hasPreviewableComponents
    ? <div
      className={`preview-container draggable${isDragging ? ' dragging' : ''}`}
      onClick={() => setState({ currentComponent: '' })}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={onMouseMove}
      onWheel={onWheel}
    >
      <PreviewOptions
        enableBackground={true}
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
          <div>
            {nls.localize('vuengine/entityEditor/step', 'Step')} {currentAnimationStep + 1}
          </div>
          <div>
            {nls.localize('vuengine/entityEditor/frame', 'Frame')} {actualCurrentFrame + 1}
          </div>
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
            key={i}
            index={i}
            sprite={sprite}
            animate={animate}
            frames={data.animations?.totalFrames || 1}
            currentAnimationFrame={actualCurrentFrame}
            highlighted={state.currentComponent === `sprites-${i}`}
            palette={state.preview.palettes[sprite.texture.palette]}
          />
        )}
        {state.preview.colliders && data.components?.colliders?.map((collider, i) => {
          switch (collider.type) {
            case ColliderType.Ball:
              return <BallCollider
                key={i}
                index={i}
                highlighted={state.currentComponent === `colliders-${i}`}
                collider={collider}
              />;
            case ColliderType.Box:
            case ColliderType.InverseBox:
              return <BoxCollider
                key={i}
                index={i}
                highlighted={state.currentComponent === `colliders-${i}`}
                collider={collider}
              />;
            case ColliderType.LineField:
              return <LineFieldCollider
                key={i}
                index={i}
                highlighted={state.currentComponent === `colliders-${i}`}
                collider={collider}
              />;
          }
        })}
        {state.preview.wireframes && data.components?.wireframes?.map((wireframe, i) =>
          <PreviewWireframe
            key={i}
            index={i}
            highlighted={state.currentComponent === `wireframes-${i}`}
            wireframe={wireframe}
          />
        )}
      </div>
    </div>
    : <div className='preview-container'>
      <div style={{ color: 'var(--theia-dropdown-border)' }}>
        {/*
        {nls.localize(
          'vuengine/entityEditor/noPreviewableComponents',
          'This entity does not yet have any previewable components (children, colliders, sprites or wireframes).',
        )}
        */}
        <IdentificationCard size={32} />
      </div>
    </div>;
}
