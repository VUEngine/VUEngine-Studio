import { nls } from '@theia/core';
import { ConfirmDialog, LocalStorageService } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import DockLayout, { LayoutBase, LayoutData } from 'rc-dock';
import React from 'react';
import Animations from './Animations/Animations';
import Behaviors from './Behaviors/Behaviors';
import Children from './Children/Children';
import Collisions from './Collisions/Collisions';
import {
  EntityData,
  EntityEditorContext,
  EntityEditorLayoutStorageName,
  EntityEditorState,
} from './EntityEditorTypes';
import General from './General/General';
import Meshes from './Meshes/Meshes';
import Physics from './Physics/Physics';
import Preview from './Preview/Preview';
import Scripts from './Scripts/Scripts';
import Sprites from './Sprites/Sprites';

interface EntityEditorProps {
  entityData: EntityData;
  updateEntityData: (entityData: EntityData) => void;
  services: {
    fileService: FileService;
    localStorageService: LocalStorageService;
    workspaceService: WorkspaceService;
  };
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
        meshes: true,
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

  setEntityData(entityData: Partial<EntityData>): void {
    this.props.updateEntityData({ ...this.props.entityData, ...entityData });
  }

  async resetLayout(): Promise<void> {
    const dialog = new ConfirmDialog({
      title: nls.localize('vuengine/entityEditor/resetLayout', 'Reset Layout'),
      msg: nls.localize(
        'vuengine/entityEditor/areYouSureYouWantToResetLayout',
        'Are you sure you want to reset the layout to default?'
      ),
    });
    const confirmed = await dialog.open();
    if (confirmed) {
      this.dockLayoutRef.loadLayout(this.defaultLayout);
      await this.props.services.localStorageService.setData(
        EntityEditorLayoutStorageName,
        undefined
      );
    }
  }

  async componentDidMount(): Promise<void> {
    this.defaultLayout = this.dockLayoutRef.getLayout();
    const savedLayout = await this.props.services.localStorageService.getData(
      EntityEditorLayoutStorageName
    );
    if (savedLayout) {
      this.dockLayoutRef.loadLayout(savedLayout as LayoutBase);
    }
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
                        {context => <Collisions />}
                      </EntityEditorContext.Consumer>
                    ),
                  },
                  {
                    id: 'tab-meshes',
                    title: nls.localize(
                      'vuengine/entityEditor/meshes',
                      'Meshes'
                    ),
                    minHeight: 200,
                    minWidth: 200,
                    content: (
                      <EntityEditorContext.Consumer>
                        {context => <Meshes />}
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
                        {context => <Sprites />}
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
                ],
              },
            ],
          },
          {
            tabs: [
              {
                id: 'tab-preview',
                title: nls.localize('vuengine/entityEditor/preview', 'Preview'),
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
        {/* <button
                className={'theia-button secondary large'}
                title={nls.localize('vuengine/entityEditor/resetLayout', 'Reset Layout')}
                onClick={this.resetLayout.bind(this)}
            >
                <i className='fa fa-undo' />
            </button> */}
        <EntityEditorContext.Provider
          value={{
            state: this.state,
            entityData: this.props.entityData,
            setState: this.setState.bind(this),
            setEntityData: this.setEntityData.bind(this),
          }}
        >
          <DockLayout
            defaultLayout={defaultLayout}
            dropMode="edge"
            ref={this.getRef}
            onLayoutChange={layout =>
              this.props.services.localStorageService.setData(
                EntityEditorLayoutStorageName,
                layout
              )
            }
          />
        </EntityEditorContext.Provider>
      </div>
    );
  }
}
