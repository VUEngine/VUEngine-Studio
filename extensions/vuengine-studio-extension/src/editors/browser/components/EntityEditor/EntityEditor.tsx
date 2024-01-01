import { URI, nls } from '@theia/core';
import DockLayout, { LayoutBase, LayoutData } from 'rc-dock';
import React from 'react';
import { ConversionResult } from '../../../../images/browser/ves-images-types';
import { EditorsDockInterface, EditorsServices } from '../../ves-editors-widget';
import Animations from './Animations/Animations';
import Behaviors from './Behaviors/Behaviors';
import Children from './Children/Children';
import Colliders from './Colliders/Colliders';
import {
  EntityData,
  EntityEditorContext,
  EntityEditorState
} from './EntityEditorTypes';
import General from './General/General';
import Physics from './Physics/Physics';
import Preview from './Preview/Preview';
import Scripts from './Scripts/Scripts';
import Sprites from './Sprites/Sprites';
import Wireframes from './Wireframes/Wireframes';

interface EntityEditorProps {
  data: EntityData;
  updateData: (entityData: EntityData) => void;
  dock: EditorsDockInterface
  fileUri: URI
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
    if (options?.appendImageData) {
      updatedData = await this.appendImageData(updatedData);
    }
    this.props.updateData(updatedData);
  }

  protected async appendImageData(entityData: EntityData): Promise<EntityData> {
    const mostFilesOnASprite = Math.max(...this.props.data.sprites.sprites.map(s => s.texture.files.length));
    const isMultiImageAnimation = this.props.data.animations.enabled && mostFilesOnASprite > 1;
    const optimizeTiles = (!this.props.data.animations.enabled && entityData.sprites.optimizedTiles)
      || (this.props.data.animations.enabled && isMultiImageAnimation);
    const baseConfig = {
      animation: {
        frames: isMultiImageAnimation ? mostFilesOnASprite : this.props.data.animations.totalFrames,
        individualFiles: isMultiImageAnimation,
        isAnimation: this.props.data.animations.enabled
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
        shared: !this.props.data.animations.enabled && entityData.sprites.sharedTiles,
      }
    };

    if (!this.props.data.animations.enabled && entityData.sprites?.sharedTiles) {
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
      entityData.sprites?.sprites?.map((sprite, index) => {
        if (sprite.texture?.files?.length) {
          sprite._imageData = {
            tiles: (index === 0) ? newImageData.tiles : undefined,
            maps: [newImageData.maps[spriteFilesIndex[sprite.texture.files[0]]]],
            _dupeIndex: 1,
          };
        }
      });
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
              ...newImageData,
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
                    id: 'tab-general',
                    title: nls.localize(
                      'vuengine/entityEditor/general',
                      'General'
                    ),
                    minHeight: 200,
                    minWidth: 200,
                    content: (
                      <EntityEditorContext.Consumer>
                        {context => <General />}
                      </EntityEditorContext.Consumer>
                    ),
                  },
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
                    id: 'tab-behaviors',
                    title: nls.localize(
                      'vuengine/entityEditor/behaviors',
                      'Behaviors'
                    ),
                    minHeight: 200,
                    minWidth: 200,
                    content: (
                      <EntityEditorContext.Consumer>
                        {context => <Behaviors />}
                      </EntityEditorContext.Consumer>
                    ),
                  },
                  {
                    id: 'tab-children',
                    title: nls.localize(
                      'vuengine/entityEditor/children',
                      'Children'
                    ),
                    minHeight: 200,
                    minWidth: 200,
                    content: (
                      <EntityEditorContext.Consumer>
                        {context => <Children />}
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
                    id: 'tab-physics',
                    title: nls.localize(
                      'vuengine/entityEditor/physics',
                      'Physics'
                    ),
                    minHeight: 200,
                    minWidth: 200,
                    content: (
                      <EntityEditorContext.Consumer>
                        {context => <Physics />}
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
