import { PuzzlePiece } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { useContext, useEffect, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import VContainer from '../../Common/Base/VContainer';
import { ColliderType } from '../../Common/VUEngineTypes';
import { ActorEditorSaveDataOptions } from '../ActorEditor';
import { ActorEditorCommands } from '../ActorEditorCommands';
import {
  AnimationData,
  ComponentData,
  ComponentKey,
  ActorEditorContext,
  ActorEditorContextType,
  MAX_PREVIEW_SPRITE_ZOOM,
  MIN_PREVIEW_SPRITE_ZOOM,
  WHEEL_SENSITIVITY
} from '../ActorEditorTypes';
import BallCollider from './Colliders/BallCollider';
import BoxCollider from './Colliders/BoxCollider';
import LineFieldCollider from './Colliders/LineFieldCollider';
import SpritePreview from './SpritePreview';
import PreviewWireframe from './Wireframes/PreviewWireframe';
import ActorEditorStatus from '../ActorEditorStatus';

interface PreviewProps {
  hasAnyComponent: boolean
  updateComponent: (key: ComponentKey, index: number, partialData: Partial<ComponentData>, options?: ActorEditorSaveDataOptions) => void,
  setCurrentComponentDisplacement: (displacements: { axis: 'x' | 'y' | 'z' | 'parallax', offset: number }[]) => void
}

export default function Preview(props: PreviewProps): React.JSX.Element {
  const { hasAnyComponent, setCurrentComponentDisplacement } = props;
  const {
    currentComponent, setCurrentComponent,
    currentAnimationStep, setCurrentAnimationStep,
    previewBackgroundColor,
    previewPalettes,
    previewProjectionDepth,
    previewShowColliders,
    previewShowSprites,
    previewShowWireframes,
    previewZoom, setPreviewZoom,
  } = useContext(ActorEditorContext) as ActorEditorContextType;
  const { data } = useContext(ActorEditorContext) as ActorEditorContextType;
  const { services } = useContext(EditorsContext) as EditorsContextType;
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [offsetX, setOffsetX] = useState<number>(0);
  const [offsetY, setOffsetY] = useState<number>(0);
  let timer: NodeJS.Timeout | undefined;

  const classNames = ['preview-container'];
  if (isDragging) {
    classNames.push('dragging');
  }

  const engineConfig = services.vesProjectService.getProjectDataItemById(ProjectContributor.Project, 'EngineConfig');
  // @ts-ignore
  const frameMultiplicator = engineConfig && engineConfig.frameRate?.frameCycle ? engineConfig.frameRate.frameCycle + 1 : 1;
  const animate = currentComponent?.startsWith('animations-');
  const currentAnimation = currentComponent?.startsWith('animations-')
    ? parseInt(currentComponent.split('animations-')[1])
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
      let zoom = Math.round((previewZoom - e.deltaY / WHEEL_SENSITIVITY) * 100) / 100;

      if (zoom > MAX_PREVIEW_SPRITE_ZOOM) {
        zoom = MAX_PREVIEW_SPRITE_ZOOM;
      } else if (zoom < MIN_PREVIEW_SPRITE_ZOOM) {
        zoom = MIN_PREVIEW_SPRITE_ZOOM;
      }

      setPreviewZoom(zoom);
    } else {
      setOffsetX(offsetX - e.deltaX / previewZoom);
      setOffsetY(offsetY - e.deltaY / previewZoom);
    }
  };

  const onMouseMove = (e: React.MouseEvent): void => {
    if (isDragging) {
      if (currentComponent) {
        setCurrentComponentDisplacement([
          { axis: 'x', offset: Math.round(e.movementX / previewZoom) },
          { axis: 'y', offset: Math.round(e.movementY / previewZoom) },
        ]);
      } else {
        setOffsetX(offsetX + e.movementX / previewZoom);
        setOffsetY(offsetY + e.movementY / previewZoom);
      }
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

  return hasPreviewableComponents
    ? <div
      className={classNames.join(' ')}
      onClick={() => setCurrentComponent('')}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={onMouseMove}
      onWheel={onWheel}
    >
      <div
        className={`preview-container-world background-color-${previewBackgroundColor}`}
        style={{
          perspective: `${previewProjectionDepth}px`,
          zoom: previewZoom,
          translate: `${offsetX}px ${offsetY}px`,
        }}
      >
        <div className="preview-container-world-center-vertical"></div>
        <div className="preview-container-world-center-horizontal"></div>
        {previewShowSprites && data.components?.sprites?.map((sprite, i) =>
          <SpritePreview
            key={i}
            index={i}
            sprite={sprite}
            animate={animate && sprite.isAnimated}
            dragging={isDragging}
            frames={sprite.isAnimated ? data.animations?.totalFrames || 1 : 1}
            currentAnimationFrame={actualCurrentFrame}
            highlighted={currentComponent === `sprites-${i}`}
            palette={previewPalettes[sprite.texture.palette]}
          />
        )}
        {previewShowColliders && data.components?.colliders?.map((collider, i) => {
          switch (collider.type) {
            case ColliderType.Ball:
              return <BallCollider
                key={i}
                index={i}
                highlighted={currentComponent === `colliders-${i}`}
                collider={collider}
              />;
            case ColliderType.Box:
            case ColliderType.InverseBox:
              return <BoxCollider
                key={i}
                index={i}
                highlighted={currentComponent === `colliders-${i}`}
                collider={collider}
              />;
            case ColliderType.LineField:
              return <LineFieldCollider
                key={i}
                index={i}
                highlighted={currentComponent === `colliders-${i}`}
                collider={collider}
              />;
          }
        })}
        {previewShowWireframes && data.components?.wireframes?.map((wireframe, i) =>
          <PreviewWireframe
            key={i}
            index={i}
            highlighted={currentComponent === `wireframes-${i}`}
            wireframe={wireframe}
          />
        )}
      </div>
      <ActorEditorStatus
        center={center}
      />
    </div>
    : <div className='preview-container'>
      <VContainer alignItems='center' style={{ color: 'var(--theia-dropdown-border)' }}>
        {!hasAnyComponent
          ? <>
            <PuzzlePiece size={32} />
            <div
              style={{
                fontSize: '160%'
              }}
            >
              {
                nls.localize(
                  'vuengine/editors/actor/actorIsEmpty',
                  'This Actor is empty',
                )
              }
            </div>
            <div>
              {nls.localize(
                'vuengine/editors/actor/clickBelowToAddFirstComponent',
                'Click below to add the first component',
              )}
            </div>
            <button
              className='theia-button secondary large'
              onClick={() => services.commandService.executeCommand(ActorEditorCommands.ADD_COMPONENT.id)}
              style={{
                marginTop: 20
              }}
            >
              <i className='codicon codicon-add' /> {nls.localize('vuengine/editors/general/addComponent', 'Add Component')}
            </button>
          </>
          : <>
            <PuzzlePiece size={32} />
            <div
              style={{
                fontSize: '160%'
              }}
            >
              {nls.localize(
                'vuengine/editors/actor/noPreviewableComponents',
                'This actor does not yet have any previewable components',
              )}
            </div>
            <div>
              {nls.localize(
                'vuengine/editors/actor/previewableComponentsList',
                'Add either a child, collider, sprite or wireframe',
              )}
            </div>
          </>
        }
      </VContainer>
    </div>;
}
