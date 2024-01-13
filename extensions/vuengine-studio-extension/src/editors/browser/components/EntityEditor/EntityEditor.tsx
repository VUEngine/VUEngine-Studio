import React from 'react';
import { ConversionResult } from '../../../../images/browser/ves-images-types';
import { EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';
import Components from './Entity/Components';
import Entity from './Entity/Entity';
import {
  EntityData,
  EntityEditorContext,
  EntityEditorState,
  defaultCurrentAnimation,
  defaultHighlightedSprite
} from './EntityEditorTypes';
import Preview from './Preview/Preview';
import SpritesSettings from './Sprites/SpritesSettings';
import CollidersSettings from './Collider/CollidersSettings';

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
      preview: {
        backgroundColor: -1,
        anaglyph: false,
        animations: false,
        currentAnimation: this.props.data.animations?.default || defaultCurrentAnimation,
        colliders: false,
        highlightedSprite: defaultHighlightedSprite,
        wireframes: false,
        palettes: ['11100100', '11100000', '11010000', '11100100'],
        sprites: true,
        zoom: 1,
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
    const savedState = await this.props.context.services.localStorageService.getData<EntityEditorState>(this.getStateLocalStorageId());
    if (savedState) {
      savedState.preview.currentAnimation = defaultCurrentAnimation;
      savedState.preview.highlightedSprite = defaultHighlightedSprite;
      this.setState({
        ...this.state,
        ...savedState,
      });
    }
  }

  protected async updateState(state: EntityEditorState): Promise<void> {
    this.setState(state);
    await this.savePreviewState();
  }

  protected async setData(entityData: Partial<EntityData>, options?: EntityEditorSaveDataOptions): Promise<void> {
    const { isGenerating, setIsGenerating } = this.props.context;

    if (!isGenerating) {
      let updatedData = this.postProcessData({ ...this.props.data, ...entityData });
      if (options?.appendImageData) {
        setIsGenerating(true);
        updatedData = await this.appendImageData(updatedData);
        setIsGenerating(false);
      }

      this.props.updateData(updatedData);
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

  protected async compressImageData(imageData: Partial<ConversionResult>): Promise<ConversionResult> {
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
        compression: entityData.sprites.compression,
        generate: true,
        reduce: {
          flipped: optimizeTiles,
          unique: optimizeTiles,
        }
      },
      name: services.vesCommonService.cleanSpecName(entityData.name),
      section: entityData.sprites.section,
      tileset: {
        compression: entityData.sprites.compression,
        shared: !entityData.components?.animations.length && entityData.sprites.sharedTiles,
      }
    };

    if (!entityData.components?.animations.length && entityData.sprites?.sharedTiles) {
      const files: string[] = [];
      // keep track of added files to be able to map back maps later
      const spriteFilesIndex: { [key: string]: number } = {};
      let mapCounter = 0;
      entityData.components?.sprites?.map(s => {
        if (s.texture?.files?.length) {
          const file = s.texture.files[0];
          if (!spriteFilesIndex[file]) {
            files.push(file);
            spriteFilesIndex[file] = mapCounter++;
          }
        }
      });

      const newImageData = await services.vesImagesService.convertImage(fileUri, {
        ...baseConfig,
        files,
      });
      // map imagedata back to sprites
      await Promise.all(entityData.components?.sprites?.map(async (sprite, index) => {
        if (sprite.texture?.files?.length) {
          const compressedImageData = await this.compressImageData({
            tiles: (index === 0) ? newImageData.tiles : undefined,
            maps: [newImageData.maps[spriteFilesIndex[sprite.texture.files[0]]]],
          });
          sprite._imageData = {
            ...compressedImageData,
            _dupeIndex: 1,
          };
        } else {
          sprite._imageData = undefined;
        }
      }));
    } else {
      const convertedFilesMap: { [key: string]: ConversionResult & { _dupeIndex: number } } = {};
      // for loop to handle sprites one after the other for dupe detection
      for (let i = 0; i < entityData.components?.sprites?.length || 0; i++) {
        const sprite = entityData.components?.sprites[i];
        if (sprite.texture?.files?.length) {
          // keep track of already converted files to avoid converting the same image twice
          const checksum = require('crc-32').str(JSON.stringify(sprite.texture?.files || ''));
          if (convertedFilesMap[checksum] !== undefined) {
            sprite._imageData = convertedFilesMap[checksum]._dupeIndex;
          } else {
            const newImageData = await services.vesImagesService.convertImage(fileUri, {
              ...baseConfig,
              files: sprite.texture.files,
            });
            const compressedImageData = await this.compressImageData(newImageData);
            sprite._imageData = convertedFilesMap[checksum] = {
              ...compressedImageData,
              _dupeIndex: i + 1,
            };
          }
        } else {
          sprite._imageData = undefined;
        }
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
        <HContainer className="entityEditor" gap={20}>
          <VContainer gap={15} grow={1}>
            <EntityEditorContext.Consumer>
              {context =>
                <VContainer gap={15}>
                  <Entity />
                  <SpritesSettings
                    isMultiFileAnimation={isMultiFileAnimation}
                  />
                  <CollidersSettings />
                  <Components />
                </VContainer>
              }
            </EntityEditorContext.Consumer>

          </VContainer>
          <VContainer gap={15}>

            <EntityEditorContext.Consumer>
              {context =>
                <Preview />
              }
            </EntityEditorContext.Consumer>

          </VContainer>
        </HContainer>
      </EntityEditorContext.Provider >
    );
  }
}
