import { URI, nls } from '@theia/core';
import DockLayout, { LayoutBase, LayoutData } from 'rc-dock';
import React from 'react';
import { EditorsDockInterface, EditorsServices } from '../../ves-editors-widget';
import Animations from './Animations/Animations';
import Behaviors from './Behaviors/Behaviors';
import Children from './Children/Children';
import Collisions from './Collisions/Collisions';
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
        collisions: true,
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

  setData(entityData: Partial<EntityData>): void {
    this.props.updateData({ ...this.props.data, ...entityData });
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
                    id: 'tab-collisions',
                    title: nls.localize(
                      'vuengine/entityEditor/collisions',
                      'Collisions'
                    ),
                    minHeight: 200,
                    minWidth: 200,
                    content: (
                      <EntityEditorContext.Consumer>
                        {context => <Collisions
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
