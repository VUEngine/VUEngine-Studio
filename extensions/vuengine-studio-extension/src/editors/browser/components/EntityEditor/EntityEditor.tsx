import { DockLayout } from '@phosphor/widgets';
import { nls } from '@theia/core';
import React from 'react';
import { ConversionResult } from '../../../../images/browser/ves-images-types';
import { EditorsContextType } from '../../ves-editors-types';
import { VesDock, WrapperWidget } from '../Common/Dock/VesDock';
import Animations from './Animations/Animations';
import Colliders from './Colliders/Colliders';
import Entity from './Entity/Entity';
import {
  EntityData,
  EntityEditorContext,
  EntityEditorState
} from './EntityEditorTypes';
import Preview from './Preview/Preview';
import Sprites from './Sprites/Sprites';
import Wireframes from './Wireframes/Wireframes';

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
        backgroundColor: 0,
        anaglyph: false,
        animations: false,
        currentAnimation: this.props.data.animations?.default || 0,
        colliders: false,
        wireframes: false,
        palettes: ['11100100', '11100000', '11010000', '11100100'],
        sprites: true,
        zoom: 1,
      },
    };
  }

  protected async setData(entityData: Partial<EntityData>, options?: EntityEditorSaveDataOptions): Promise<void> {
    const { isGenerating, setIsGenerating } = this.props.context;
    let updatedData = this.postProcessData({ ...this.props.data, ...entityData });

    if (!isGenerating) {
      if (options?.appendImageData) {
        setIsGenerating(true);
        updatedData = await this.appendImageData(updatedData);
        setIsGenerating(false);
      }

      this.props.updateData(updatedData);
    }
  }

  protected postProcessData(entityData: EntityData): EntityData {
    if (!entityData.animations.enabled) {
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
    const isMultiFileAnimation = entityData.animations.enabled && mostFilesOnASprite > 1;
    const optimizeTiles = (!entityData.animations.enabled && entityData.sprites.optimizedTiles)
      || (entityData.animations.enabled && isMultiFileAnimation);
    const baseConfig = {
      animation: {
        frames: isMultiFileAnimation ? mostFilesOnASprite : entityData.animations.totalFrames,
        individualFiles: isMultiFileAnimation,
        isAnimation: entityData.animations.enabled
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
        shared: !entityData.animations.enabled && entityData.sprites.sharedTiles,
      }
    };

    if (!entityData.animations.enabled && entityData.sprites?.sharedTiles) {
      const files: string[] = [];
      // keep track of added files to be able to map back maps later
      const spriteFilesIndex: { [key: string]: number } = {};
      let mapCounter = 0;
      entityData.sprites?.sprites?.map(s => {
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
      await Promise.all(entityData.sprites?.sprites?.map(async (sprite, index) => {
        if (sprite.texture?.files?.length) {
          sprite._imageData = {
            ...(await this.compressImageData({
              tiles: (index === 0) ? newImageData.tiles : undefined,
              maps: [newImageData.maps[spriteFilesIndex[sprite.texture.files[0]]]],
            })),
            _dupeIndex: 1,
          };
        }
      }));
    } else {
      const convertedFilesMap: { [key: string]: ConversionResult & { _dupeIndex: number } } = {};
      // for loop to handle sprites one after the other for dupe detection
      for (let i = 0; i < entityData.sprites?.sprites?.length || 0; i++) {
        const sprite = entityData.sprites?.sprites[i];
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
            sprite._imageData = convertedFilesMap[checksum] = {
              ...(await this.compressImageData(newImageData)),
              _dupeIndex: i + 1,
            };
          }
        }
      }
    }

    return entityData;
  }

  protected getMostFilesOnASprite(entityData: EntityData): number {
    return Math.max(...entityData.sprites.sprites.map(s => s.texture.files.length));
  }

  async componentDidMount(): Promise<void> {
    // const { dock } = this.props.context;
    // dock.restoreLayout();
  }

  render(): React.JSX.Element {
    const { data } = this.props;

    const mostFilesOnASprite = this.getMostFilesOnASprite(data);
    const isMultiFileAnimation = mostFilesOnASprite > 1;

    const defaultLayout: DockLayout.ILayoutConfig = {
      main: {
        type: 'split-area',
        orientation: 'horizontal',
        children: [{
          type: 'tab-area',
          widgets: [
            new WrapperWidget(
              nls.localize('vuengine/entityEditor/animations', 'General'),
              <EntityEditorContext.Consumer>
                {context => <Animations />}
              </EntityEditorContext.Consumer>
            ),
            new WrapperWidget(
              nls.localize('vuengine/entityEditor/colliders', 'Colliders'),
              <EntityEditorContext.Consumer>
                {context => <Colliders />}
              </EntityEditorContext.Consumer>
            ),
            new WrapperWidget(
              nls.localize('vuengine/entityEditor/entity', 'Entity'),
              <EntityEditorContext.Consumer>
                {context => <Entity />}
              </EntityEditorContext.Consumer>
            ),
            new WrapperWidget(
              nls.localize('vuengine/entityEditor/sprites', 'Sprites'),
              <EntityEditorContext.Consumer>
                {context => <Sprites
                  isMultiFileAnimation={isMultiFileAnimation}
                />}
              </EntityEditorContext.Consumer>
            ),
            /*
            new WrapperWidget(
              nls.localize('vuengine/entityEditor/scripts', 'Scripts'),
              <EntityEditorContext.Consumer>
                {context => <Scripts />}
              </EntityEditorContext.Consumer>
            ),
            new WrapperWidget(
              nls.localize('vuengine/entityEditor/states', 'States'),
              <EntityEditorContext.Consumer>
                {context => <States />}
              </EntityEditorContext.Consumer>
            ),
            */
            new WrapperWidget(
              nls.localize('vuengine/entityEditor/wireframes', 'Wireframes'),
              <EntityEditorContext.Consumer>
                {context => <Wireframes />}
              </EntityEditorContext.Consumer>
            )
          ],
          currentIndex: 0
        }, {
          type: 'tab-area',
          widgets: [
            new WrapperWidget(
              nls.localize('vuengine/entityEditor/preview', 'Preview'),
              <EntityEditorContext.Consumer>
                {context => <Preview />}
              </EntityEditorContext.Consumer>
            )
          ],
          currentIndex: 0
        }],
        sizes: [0.8, 0.2]
      }
    };

    return (
      <div className="entityEditor">
        <EntityEditorContext.Provider
          value={{
            state: this.state,
            setState: this.setState.bind(this),
            data,
            setData: this.setData.bind(this),
          }}
        >
          <VesDock
            defaultLayout={defaultLayout}
          />
        </EntityEditorContext.Provider>
      </div>
    );
  }
}
