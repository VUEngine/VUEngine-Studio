import { URI, nls } from '@theia/core';
import DockLayout, { LayoutBase, LayoutData } from 'rc-dock';
import React from 'react';
import { ConversionResult } from '../../../../images/browser/ves-images-types';
import { EditorsDockInterface, EditorsServices } from '../../ves-editors-widget';
import Animations from './Animations/Animations';
import Colliders from './Colliders/Colliders';
import Entity from './Entity/Entity';
import {
  EntityData,
  EntityEditorContext,
  EntityEditorState
} from './EntityEditorTypes';
import Preview from './Preview/Preview';
import Scripts from './Scripts/Scripts';
import Sprites from './Sprites/Sprites';
import Wireframes from './Wireframes/Wireframes';

interface EntityEditorProps {
  data: EntityData;
  updateData: (entityData: EntityData) => void;
  fileUri: URI
  isGenerating: boolean
  setIsGenerating: (isGenerating: boolean) => void
  dock: EditorsDockInterface
  services: EditorsServices
}

export interface EntityEditorSaveDataOptions {
  appendImageData?: boolean
}

export default class EntityEditor extends React.Component<
  EntityEditorProps,
  EntityEditorState
> {
  constructor(props: EntityEditorProps) {
    super(props);
    this.state = {
      preview: {
        anaglyph: false,
        animations: true,
        colliders: true,
        wireframes: true,
        palettes: ['11100100', '11100000', '11010000', '11100100'],
        sprites: true,
        zoom: 8,
      },
    };
  }

  protected defaultLayout: LayoutBase;
  protected dockLayoutRef: DockLayout;

  getRef = (r: DockLayout) => {
    this.dockLayoutRef = r;
  };

  protected async setData(entityData: Partial<EntityData>, options?: EntityEditorSaveDataOptions): Promise<void> {
    let updatedData = { ...this.props.data, ...entityData };

    if (!this.props.isGenerating) {
      if (options?.appendImageData) {
        this.props.setIsGenerating(true);
        updatedData = await this.appendImageData(updatedData);
        this.props.setIsGenerating(false);
      }

      this.props.updateData(updatedData);
    }
  }

  protected async compressImageData(imageData: Partial<ConversionResult>): Promise<ConversionResult> {
    if (imageData.tiles) {
      let frameOffsets = {};
      if (imageData.tiles.frameOffsets) {
        frameOffsets = {
          frameOffsets: await this.props.services.vesCommonService.compressJson(imageData.tiles.frameOffsets),
        };
      }
      imageData = {
        ...imageData,
        tiles: {
          ...imageData.tiles,
          data: await this.props.services.vesCommonService.compressJson(imageData.tiles.data),
          ...frameOffsets,
        },
      };
    }

    if (imageData.maps) {
      imageData = {
        ...imageData,
        maps: await Promise.all(imageData.maps.map(async m => ({
          ...m,
          data: await this.props.services.vesCommonService.compressJson(m.data),
        }))),
      };
    }

    return imageData as ConversionResult;
  }

  protected async appendImageData(entityData: EntityData): Promise<EntityData> {
    const mostFilesOnASprite = Math.max(...entityData.sprites.sprites.map(s => s.texture.files.length));
    const isMultiImageAnimation = entityData.animations.enabled && mostFilesOnASprite > 1;
    const optimizeTiles = (!entityData.animations.enabled && entityData.sprites.optimizedTiles)
      || (entityData.animations.enabled && isMultiImageAnimation);
    const baseConfig = {
      animation: {
        frames: isMultiImageAnimation ? mostFilesOnASprite : entityData.animations.totalFrames,
        individualFiles: isMultiImageAnimation,
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
      name: this.props.services.vesCommonService.cleanSpecName(entityData.name),
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

      const newImageData = await this.props.services.vesImagesService.convertImage(this.props.fileUri, {
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
            const newImageData = await this.props.services.vesImagesService.convertImage(this.props.fileUri, {
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

  async componentDidMount(): Promise<void> {
    this.props.dock.restoreLayout();
  }

  render(): React.JSX.Element {
    const defaultLayout: LayoutData = {
      dockbox: {
        mode: 'horizontal',
        children: [
          {
            size: 99999,
            mode: 'vertical',
            children: [
              {
                tabs: [
                  {
                    id: 'tab-animations',
                    title: nls.localize(
                      'vuengine/entityEditor/animations',
                      'Animations'
                    ),
                    minHeight: 200,
                    minWidth: 200,
                    content: (
                      <EntityEditorContext.Consumer>
                        {context => <Animations />}
                      </EntityEditorContext.Consumer>
                    ),
                  },
                  {
                    id: 'tab-colliders',
                    title: nls.localize(
                      'vuengine/entityEditor/colliders',
                      'Colliders'
                    ),
                    minHeight: 200,
                    minWidth: 200,
                    content: (
                      <EntityEditorContext.Consumer>
                        {context => <Colliders
                          services={this.props.services}
                        />}
                      </EntityEditorContext.Consumer>
                    ),
                  },
                  {
                    id: 'tab-entity',
                    title: nls.localize(
                      'vuengine/entityEditor/entity',
                      'Entity'
                    ),
                    minHeight: 200,
                    minWidth: 200,
                    content: (
                      <EntityEditorContext.Consumer>
                        {context => <Entity
                          hoverService={this.props.services.hoverService}
                        />}
                      </EntityEditorContext.Consumer>
                    ),
                  },
                  {
                    id: 'tab-sprites',
                    title: nls.localize(
                      'vuengine/entityEditor/sprites',
                      'Sprites'
                    ),
                    minHeight: 200,
                    minWidth: 200,
                    content: (
                      <EntityEditorContext.Consumer>
                        {context => <Sprites
                          fileUri={this.props.fileUri}
                          services={this.props.services}
                        />}
                      </EntityEditorContext.Consumer>
                    ),
                  },
                  {
                    id: 'tab-scripts',
                    title: nls.localize(
                      'vuengine/entityEditor/scripts',
                      'Scripts'
                    ),
                    minHeight: 200,
                    minWidth: 200,
                    content: (
                      <EntityEditorContext.Consumer>
                        {context => <Scripts />}
                      </EntityEditorContext.Consumer>
                    ),
                  },
                  {
                    id: 'tab-wireframes',
                    title: nls.localize(
                      'vuengine/entityEditor/wireframes',
                      'Wireframes'
                    ),
                    minHeight: 200,
                    minWidth: 200,
                    content: (
                      <EntityEditorContext.Consumer>
                        {context => <Wireframes />}
                      </EntityEditorContext.Consumer>
                    ),
                  },
                ],
              },
            ],
          },
          {
            tabs: [
              {
                id: 'tab-preview',
                title: nls.localize(
                  'vuengine/entityEditor/preview',
                  'Preview'
                ),
                minHeight: 250,
                minWidth: 250,
                content: (
                  <EntityEditorContext.Consumer>
                    {context => (
                      <Preview
                        fileService={this.props.services.fileService}
                        workspaceService={this.props.services.workspaceService}
                      />
                    )}
                  </EntityEditorContext.Consumer>
                ),
              },
            ],
          },
        ],
      },
    };

    return (
      <div className="entityEditor">
        <EntityEditorContext.Provider
          value={{
            state: this.state,
            setState: this.setState.bind(this),
            data: this.props.data,
            setData: this.setData.bind(this),
          }}
        >
          <DockLayout
            style={{ flexGrow: 1 }}
            defaultLayout={defaultLayout}
            dropMode="edge"
            ref={this.props.dock.getRef}
            onLayoutChange={this.props.dock.persistLayout}
          />
        </EntityEditorContext.Provider>
      </div>
    );
  }
}
