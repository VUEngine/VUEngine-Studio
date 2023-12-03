import { MessageService, URI, nls } from '@theia/core';
import { LocalStorageService } from '@theia/core/lib/browser';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import DockLayout, { LayoutBase, LayoutData } from 'rc-dock';
import React from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';
import Animation from './Animation/Animation';
import General from './General/General';
import { ImageConvEditorContext, ImageConvEditorLayoutStorageName, ImageConvEditorState } from './ImageConvEditorTypes';
import Preview from './Preview/Preview';
import TilesMap from './TilesMap/TilesMap';

interface ImageConvProps {
    data: ImageConfig
    updateData: (data: ImageConfig) => void
    fileUri: URI
    services: {
        fileService: FileService,
        fileDialogService: FileDialogService,
        localStorageService: LocalStorageService
        messageService: MessageService,
        workspaceService: WorkspaceService,
    }
}

export default class ImageConvEditor extends React.Component<ImageConvProps, ImageConvEditorState> {
    constructor(props: ImageConvProps) {
        super(props);
        this.state = {
            preview: {
                animations: true,
                palette: '11100100',
                zoom: 1,
            },
        };
    }

    protected defaultLayout: LayoutBase;
    protected dockLayoutRef: DockLayout;

    getRef = (r: DockLayout) => {
        this.dockLayoutRef = r;
    };

    setEntityData(data: Partial<ImageConfig>): void {
        this.props.updateData({ ...this.props.data, ...data });
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
                                            'vuengine/imageConvEditor/general',
                                            'General'
                                        ),
                                        minHeight: 200,
                                        minWidth: 200,
                                        content: (
                                            <ImageConvEditorContext.Consumer>
                                                {context => <General
                                                    fileUri={this.props.fileUri}
                                                    fileService={this.props.services.fileService}
                                                    fileDialogService={this.props.services.fileDialogService}
                                                    messageService={this.props.services.messageService}
                                                    workspaceService={this.props.services.workspaceService}
                                                />}
                                            </ImageConvEditorContext.Consumer>
                                        ),
                                    },
                                    {
                                        id: 'tab-tiles-map',
                                        title: nls.localize(
                                            'vuengine/imageConvEditor/tilesAndMap',
                                            'Tiles & Map'
                                        ),
                                        minHeight: 200,
                                        minWidth: 200,
                                        content: (
                                            <ImageConvEditorContext.Consumer>
                                                {context => <TilesMap />}
                                            </ImageConvEditorContext.Consumer>
                                        ),
                                    },
                                    {
                                        id: 'tab-animation',
                                        title: nls.localize(
                                            'vuengine/imageConvEditor/animation',
                                            'Animation'
                                        ),
                                        minHeight: 200,
                                        minWidth: 200,
                                        content: (
                                            <ImageConvEditorContext.Consumer>
                                                {context => <Animation />}
                                            </ImageConvEditorContext.Consumer>
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
                                    'vuengine/imageConvEditor/preview',
                                    'Preview'
                                ),
                                minHeight: 250,
                                minWidth: 250,
                                content: (
                                    <ImageConvEditorContext.Consumer>
                                        {context => <Preview
                                            fileService={this.props.services.fileService}
                                            workspaceService={this.props.services.workspaceService}
                                        />}
                                    </ImageConvEditorContext.Consumer>
                                ),
                            },
                        ],
                    },
                ],
            },
        };

        return (
            <div className="imageConvEditor">
                {/* <button
                  className={'theia-button secondary large'}
                  title={nls.localize('vuengine/entityEditor/resetLayout', 'Reset Layout')}
                  onClick={this.resetLayout.bind(this)}
              >
                  <i className='fa fa-undo' />
              </button> */}
                <ImageConvEditorContext.Provider
                    value={{
                        state: this.state,
                        imageConvData: this.props.data,
                        setState: this.setState.bind(this),
                        setImageConvData: this.setEntityData.bind(this),
                    }}
                >
                    <DockLayout
                        defaultLayout={defaultLayout}
                        dropMode="edge"
                        ref={this.getRef}
                        onLayoutChange={layout =>
                            this.props.services.localStorageService.setData(
                                ImageConvEditorLayoutStorageName,
                                layout
                            )
                        }
                    />
                </ImageConvEditorContext.Provider>
            </div>
        );
    }
}
