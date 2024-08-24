import { isBoolean, isNumber, nls } from '@theia/core';
import React from 'react';
import styled from 'styled-components';
import { ConversionResult } from '../../../../images/browser/ves-images-types';
import { EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/HContainer';
import ComponentTree from './Components/ComponentTree';
import CurrentComponent from './Components/CurrentComponent';
import EntityMeta from './Entity/EntityMeta';
import {
  EntityData,
  EntityEditorContext,
  EntityEditorPreviewState,
  EntityEditorState,
  MAX_PREVIEW_SPRITE_ZOOM,
  MIN_PREVIEW_SPRITE_ZOOM,
  SpriteImageData,
} from './EntityEditorTypes';
import Preview from './Preview/Preview';
import Script from './Scripts/Script';

interface EditorSidebarProps {
  show: boolean
  orientation: 'left' | 'right'
}

const EditorSidebar = styled.div<EditorSidebarProps>`
  background-color: rgba(17, 17, 17, .9);
  border-radius: 2px;
  border: 1px solid var(--theia-activityBar-background);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  margin-${p => p.orientation}: ${p => p.show ? 0 : 'calc(-320px - 1px - var(--padding))'};
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  transition: all .1s;
  width: 320px;
  z-index: 100;

  body.light-vuengine & {
    background-color: rgba(236, 236, 236, .9);
  }
`;

interface ShowTreeButtonProps {
  show: boolean
}

const ShowTreeButton = styled.button<ShowTreeButtonProps>`
  left: var(--padding);
  opacity: ${p => p.show ? 1 : 0};
  position: absolute;
  top: calc(var(--padding) + 4px);
  transition: all .1s;
  width: 32px;
  z-index: 100;
`;

const HideTreeButton = styled.button`
  padding: 0;
  position: absolute;
  right: 3px;
  top: 3px;
  width: 32px;
  z-index: 100;
`;

interface EntityEditorProps {
  data: EntityData;
  updateData: (entityData: EntityData) => void;
  context: EditorsContextType
}

export interface EntityEditorSaveDataOptions {
  appendImageData?: boolean
}

export default class EntityEditor extends React.Component<EntityEditorProps, EntityEditorState> {
  constructor(props: EntityEditorProps) {
    super(props);
    this.state = {
      currentComponent: '',
      currentAnimationStep: 0,
      leftSidebarOpen: true,
      preview: {
        backgroundColor: -1,
        anaglyph: false,
        children: true,
        colliders: true,
        wireframes: true,
        palettes: ['11100100', '11100000', '11010000', '11100100'],
        sprites: true,
        zoom: 2,
        projectionDepth: 99999, // 128,
      },
    };
  }

  protected getStateLocalStorageId(): string {
    return `ves-editors-Entity-state/${this.props.context.fileUri.path.fsPath()}`;
  }

  protected async savePreviewState(): Promise<void> {
    return this.props.context.services.localStorageService.setData<EntityEditorState>(this.getStateLocalStorageId(), this.state);
  }

  protected async restorePreviewState(): Promise<void> {
    // Beware! This can cause hard to track unwanted side effects with outdated states in storage. Apply values with caution.
    const savedState = await this.props.context.services.localStorageService.getData<EntityEditorState>(this.getStateLocalStorageId());
    if (!savedState) {
      return;
    }

    const overlayState: Partial<EntityEditorPreviewState> = {};
    if (isBoolean(savedState.preview.anaglyph)) {
      overlayState.anaglyph = (savedState.preview.anaglyph);
    }
    if (isNumber(savedState.preview.backgroundColor) &&
      savedState.preview.backgroundColor < 3 &&
      savedState.preview.backgroundColor > -1) {
      overlayState.backgroundColor = (savedState.preview.backgroundColor);
    }
    if (isBoolean(savedState.preview.colliders)) {
      overlayState.colliders = (savedState.preview.colliders);
    }
    if (isNumber(savedState.preview.zoom) &&
      savedState.preview.zoom <= MAX_PREVIEW_SPRITE_ZOOM &&
      savedState.preview.zoom >= MIN_PREVIEW_SPRITE_ZOOM) {
      overlayState.zoom = (savedState.preview.zoom);
    }
    if (isBoolean(savedState.preview.sprites)) {
      overlayState.sprites = (savedState.preview.sprites);
    }
    if (isBoolean(savedState.preview.wireframes)) {
      overlayState.wireframes = (savedState.preview.wireframes);
    }

    if (savedState) {
      this.setState({
        preview: {
          ...this.state.preview,
          ...overlayState,
        }
      });
    }
  }

  protected async updateState(state: EntityEditorState): Promise<void> {
    this.setState(state);
    return this.savePreviewState();
  }

  protected async setData(entityData: Partial<EntityData>, options?: EntityEditorSaveDataOptions): Promise<void> {
    const { isGenerating, setIsGenerating } = this.props.context;

    if (!isGenerating) {
      const updatedData = this.postProcessData({ ...this.props.data, ...entityData });
      if (options?.appendImageData) {
        setIsGenerating(true);
        this.appendImageData(updatedData).then(d => {
          this.props.updateData(d);
          setIsGenerating(false);
        });
      } else {
        this.props.updateData(updatedData);
      }
    }
  }

  protected postProcessData(entityData: EntityData): EntityData {
    if (!entityData.components?.animations.length) {
      // set total frames to 1 when disabling animations
      entityData.animations.totalFrames = 1;
    } else {
      // total frames to most images on sprite, if multi file animation
      const mostFilesOnASprite = this.getMostFilesOnASprite(entityData);
      const isMultiFileAnimation = mostFilesOnASprite > 1;
      if (isMultiFileAnimation) {
        entityData.animations.totalFrames = mostFilesOnASprite;
      }
    }

    return entityData;
  }

  protected async compressImageDataAsJson(imageData: Partial<ConversionResult>): Promise<ConversionResult> {
    const { services } = this.props.context;
    if (imageData.tiles) {
      let frameOffsets = {};
      if (imageData.tiles.frameOffsets) {
        frameOffsets = {
          frameOffsets: await services.vesCommonService.compressJson(imageData.tiles.frameOffsets),
        };
      }
      imageData = {
        ...imageData,
        tiles: {
          ...imageData.tiles,
          data: await services.vesCommonService.compressJson(imageData.tiles.data),
          ...frameOffsets,
        },
      };
    }

    if (imageData.maps) {
      imageData = {
        ...imageData,
        maps: await Promise.all(imageData.maps.map(async m => ({
          ...m,
          data: await services.vesCommonService.compressJson(m.data),
        }))),
      };
    }

    return imageData as ConversionResult;
  }

  protected async appendImageData(entityData: EntityData): Promise<EntityData> {
    const { fileUri, services, setGeneratingProgress } = this.props.context;

    const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;
    const mostFilesOnASprite = this.getMostFilesOnASprite(entityData);
    const isMultiFileAnimation = entityData.components?.animations.length > 0 && mostFilesOnASprite > 1;
    const totalSprites = entityData.components?.sprites?.length ?? 0;

    for (let i = 0; i < totalSprites; i++) {
      const sprite = entityData.components?.sprites[i];
      const optimizeTiles = (entityData.components?.animations.length === 0 && sprite.optimizeTiles)
        || (entityData.components?.animations.length > 0 && isMultiFileAnimation);
      if (sprite.texture?.files?.length) {
        // possible scenarios:
        // 1) mono image: files.length = 1
        // 2) stereo image: files.length = 1 && files2.length = 1
        // 3) mono video: files.length = n
        // 4) stereo video: files.length = n && files2.length = n
        let files = [
          sprite.texture?.files || [],
          sprite.texture?.files2 || [],
        ];
        const isStereoSprite = sprite.texture?.files?.length === 1 && sprite.texture?.files2?.length === 1;
        if (isStereoSprite) {
          files = [[sprite.texture.files[0], sprite.texture.files2[0]]];
        }
        sprite._imageData = {
          images: [],
        };
        await Promise.all(files.map(async (f, j) => {
          if (!f?.length) {
            return;
          }

          const name = services.vesCommonService.cleanSpecName(workspaceRootUri.resolve(f[0]).path.name);
          const nameSuffix = files.length === 2 ? j ? 'R' : 'L' : '';
          const newImageData = await services.vesImagesService.convertImage(fileUri, {
            name: name + nameSuffix,
            section: sprite.section,
            animation: {
              frames: isMultiFileAnimation ? mostFilesOnASprite : entityData.animations.totalFrames,
              individualFiles: isMultiFileAnimation,
              isAnimation: entityData.components?.animations.length > 0
            },
            map: {
              compression: sprite.compression,
              generate: true,
              reduce: {
                flipped: optimizeTiles,
                unique: optimizeTiles,
              },
            },
            tileset: {
              compression: sprite.compression,
              shared: isStereoSprite,
            },
            files: f,
            imageProcessingSettings: sprite.imageProcessingSettings,
            colorMode: sprite.colorMode,
          });
          setGeneratingProgress((i + 1) * 2 - 1, totalSprites * 2);
          const compressedImageData = await this.compressImageDataAsJson(newImageData);
          (sprite._imageData! as SpriteImageData).images[j] = {
            ...compressedImageData,
          };
        }));
      } else {
        sprite._imageData = undefined;
      }
      setGeneratingProgress((i + 1) * 2, totalSprites * 2);
    }

    return entityData;
  }

  protected getMostFilesOnASprite(entityData: EntityData): number {
    return Math.max(...entityData.components?.sprites.map(s => s.texture.files.length));
  }

  async componentDidMount(): Promise<void> {
    await this.restorePreviewState();
  }

  render(): React.JSX.Element {
    const { data } = this.props;

    const mostFilesOnASprite = this.getMostFilesOnASprite(data);
    const isMultiFileAnimation = mostFilesOnASprite > 1;

    console.log('getProjectDataItemsForType', this.props.context.services.vesProjectService.getProjectDataItemsForType('Entity'));

    return (
      <div
        className="entityEditor">
        <EntityEditorContext.Provider
          value={{
            state: this.state,
            setState: this.updateState.bind(this),
            data,
            setData: this.setData.bind(this),
          }}
        >
          <EntityEditorContext.Consumer>
            {context =>
              this.state.currentComponent?.startsWith('scripts-')
                ? <Script
                  index={parseInt(this.state.currentComponent?.split('-')[1] ?? '0')}
                />
                : <Preview />
            }
          </EntityEditorContext.Consumer>
          <EntityEditorContext.Consumer>
            {context => <HContainer
              alignItems='start'
              grow={1}
              justifyContent='space-between'
              overflow='hidden'
              style={{
                marginBottom: 40,
              }}
            >
              <EditorSidebar
                show={this.state.leftSidebarOpen}
                orientation='left'
                style={{ position: 'relative' }}
              >
                <HideTreeButton
                  className="theia-button secondary"
                  title={nls.localize('vuengine/entityEditor/showComponentsTree', 'Show Components Tree')}
                  onClick={() => this.setState({
                    ...this.state,
                    leftSidebarOpen: false,
                  })}
                >
                  <i className="codicon codicon-chevron-left" />
                </HideTreeButton>
                <EntityMeta />
                <ComponentTree />
              </EditorSidebar>
              {!this.state.leftSidebarOpen &&
                <ShowTreeButton
                  show={!this.state.leftSidebarOpen}
                  className="theia-button secondary"
                  title={nls.localize('vuengine/entityEditor/showComponentsTree', 'Show Components Tree')}
                  onClick={() => this.setState({
                    ...this.state,
                    leftSidebarOpen: true,
                  })}
                >
                  <i className="codicon codicon-list-tree" />
                </ShowTreeButton>
              }

              <EditorSidebar
                show={this.state.currentComponent.includes('-') || ['animations', 'colliders', 'extraProperties', 'physics', 'sprites'].includes(this.state.currentComponent)}
                orientation='right'
              >
                <CurrentComponent
                  isMultiFileAnimation={isMultiFileAnimation}
                />
              </EditorSidebar>
            </HContainer>
            }
          </EntityEditorContext.Consumer>
        </EntityEditorContext.Provider>
      </div>
    );
  }
}
