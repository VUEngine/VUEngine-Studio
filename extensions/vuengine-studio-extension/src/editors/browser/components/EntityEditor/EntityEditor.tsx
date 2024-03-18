import { isBoolean, isNumber } from '@theia/core';
import React from 'react';
import { ConversionResult, ConversionResultMapData, ImageCompressionType } from '../../../../images/browser/ves-images-types';
import { EditorsContextType } from '../../ves-editors-types';
import { DataSection } from '../Common/CommonTypes';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';
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
} from './EntityEditorTypes';
import Preview from './Preview/Preview';
import Script from './Scripts/Script';

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
        setIsGenerating(true, 0);
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
    const { setGeneratingProgress } = this.props.context;
    const { fileUri, services } = this.props.context;

    const mostFilesOnASprite = this.getMostFilesOnASprite(entityData);
    const isMultiFileAnimation = entityData.components?.animations.length > 0 && mostFilesOnASprite > 1;
    const optimizeTiles = (entityData.components?.animations.length === 0 && entityData.sprites.optimizedTiles)
      || (entityData.components?.animations.length > 0 && isMultiFileAnimation);
    const baseConfig = {
      animation: {
        frames: isMultiFileAnimation ? mostFilesOnASprite : entityData.animations.totalFrames,
        individualFiles: isMultiFileAnimation,
        isAnimation: entityData.components?.animations.length > 0
      },
      files: [],
      map: {
        generate: true,
        reduce: {
          flipped: optimizeTiles,
          unique: optimizeTiles,
        }
      },
      name: services.vesCommonService.cleanSpecName(fileUri.path.name),
      tileset: {
        shared: !entityData.components?.animations.length && entityData.sprites.sharedTiles,
      }
    };
    const totalSprites = entityData.components?.sprites?.length ?? 0;

    if (!entityData.components?.animations.length &&
      (entityData.components?.sprites?.length === 1 || entityData.sprites?.sharedTiles)
    ) {
      const files: string[] = [];
      entityData.components?.sprites?.map(s => {
        [s.texture?.files, s.texture?.files2].map(f => {
          if (f?.length) {
            const file = f[0];
            if (!files.includes(file)) {
              files.push(file);
            }
          }
        });
      });

      const newImageData = await services.vesImagesService.convertImage(fileUri, {
        ...baseConfig,
        section: entityData.components?.sprites.length > 0
          ? entityData.components?.sprites[0].section
          : DataSection.ROM,
        map: {
          ...baseConfig.map,
          compression: entityData.components?.sprites.length > 0
            ? entityData.components?.sprites[0].compression
            : ImageCompressionType.NONE,
        },
        tileset: {
          ...baseConfig.tileset,
          compression: entityData.components?.sprites.length > 0
            ? entityData.components?.sprites[0].compression
            : ImageCompressionType.NONE,
        },
        files,
      });

      // map imagedata back to sprites
      await services.workspaceService.ready;
      const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;
      await Promise.all(entityData.components?.sprites?.map(async (s, i) => {
        if (s.texture?.files?.length) {
          if (s.texture?.files?.length) {
            const maps: ConversionResultMapData[] = [];
            const name = workspaceRootUri.resolve(s.texture.files[0]).path.name;
            const foundMap = newImageData.maps.find(m => m.name === name);
            if (foundMap) {
              maps.push(foundMap);
            }
            if (s.texture?.files2?.length) {
              const name2 = workspaceRootUri.resolve(s.texture.files2[0]).path.name;
              const foundMap2 = newImageData.maps.find(m => m.name === name2);
              if (foundMap2) {
                maps.push(foundMap2);
              }
            }
            const compressedImageData = await this.compressImageDataAsJson({
              tiles: (i === 0) ? newImageData.tiles : undefined,
              maps,
            });
            s._imageData = {
              ...compressedImageData,
              _dupeIndex: 1,
            };
          } else {
            s._imageData = undefined;
          }
        }
      }));
    } else {
      const convertedFilesMap: { [key: string]: ConversionResult & { _dupeIndex: number } } = {};
      // for loop to handle sprites synchronously for dupe detection
      for (let i = 0; i < totalSprites; i++) {
        const sprite = entityData.components?.sprites[i];
        if (sprite.texture?.files?.length) {
          const files = [
            ...sprite.texture.files,
            ...(sprite.texture.files2 ?? []),
          ];
          // keep track of already converted files to avoid converting the same image twice
          const checksum = require('crc-32').str(JSON.stringify(files));
          if (convertedFilesMap[checksum] !== undefined) {
            sprite._imageData = convertedFilesMap[checksum]._dupeIndex;
          } else {
            const newImageData = await services.vesImagesService.convertImage(fileUri, {
              ...baseConfig,
              section: sprite.section,
              map: {
                ...baseConfig.map,
                compression: sprite.compression,
              },
              tileset: {
                ...baseConfig.tileset,
                compression: sprite.compression,
                shared: files.length === 2,
              },
              files,
            });
            setGeneratingProgress(i + 1 * 2 - 1, totalSprites * 2);
            const compressedImageData = await this.compressImageDataAsJson(newImageData);
            sprite._imageData = convertedFilesMap[checksum] = {
              ...compressedImageData,
              _dupeIndex: i + 1,
            };
          }
        } else {
          sprite._imageData = undefined;
        }
        setGeneratingProgress(i + 1 * 2, totalSprites * 2);
      }
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

    return (
      <EntityEditorContext.Provider
        value={{
          state: this.state,
          setState: this.updateState.bind(this),
          data,
          setData: this.setData.bind(this),
        }}
      >
        <HContainer
          className="entityEditor"
          gap={0}
          grow={1}
          overflow='auto'
        >
          <EntityEditorContext.Consumer>
            {context =>
              <VContainer
                gap={15}
                overflow='auto'
                onClick={() => this.setState({ currentComponent: '' })}
              >
                <EntityMeta />
                <ComponentTree />
              </VContainer>
            }
          </EntityEditorContext.Consumer>
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
            {context =>
              <VContainer gap={15} overflow='auto'>
                <CurrentComponent
                  isMultiFileAnimation={isMultiFileAnimation}
                />
              </VContainer>
            }
          </EntityEditorContext.Consumer>
        </HContainer>

      </EntityEditorContext.Provider>
    );
  }
}
