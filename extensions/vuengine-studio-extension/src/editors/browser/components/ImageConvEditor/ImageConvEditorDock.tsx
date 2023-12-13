import { MessageService, URI, nls } from '@theia/core';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import React, { useEffect, useState } from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { LocalStorageService } from '@theia/core/lib/browser';
import { ImageConvEditorContext, ImageConvEditorLayoutStorageName } from './ImageConvEditorTypes';
import DockLayout, { LayoutData } from 'rc-dock';
import TilesMap from './TilesMap/TilesMap';
import Animation from './Animation/Animation';
import Preview from './Preview/Preview';
import General from './General/General';

interface ImageConvEditorDockProps {
    data: ImageConfig
    updateData: (data: ImageConfig) => void
    fileUri: URI
    fileService: FileService,
    fileDialogService: FileDialogService
    localStorageService: LocalStorageService
    messageService: MessageService
    workspaceService: WorkspaceService
}

export default function ImageConvEditorDock(props: ImageConvEditorDockProps): React.JSX.Element {
    const {
        data,
        updateData,
        fileUri,
        fileService,
        fileDialogService,
        localStorageService,
        messageService,
        workspaceService,
    } = props;
    const [filesToShow, setFilesToShow] = useState<{ [path: string]: string }>({});
    const workspaceRootUri = workspaceService.tryGetRoots()[0]?.resource;

    // let dockLayoutRef: DockLayout;

    const getRef = (r: DockLayout) => {
        // dockLayoutRef = r;
    };

    const determineFilesToShow = async () => {
        const f = data.files.length > 0
            ? data.files
            : await Promise.all(window.electronVesCore.findFiles(await fileService.fsPath(fileUri.parent), '*.png')
                .map(async p => {
                    const fullUri = fileUri.parent.resolve(p);
                    const relativePath = workspaceRootUri.relative(fullUri)?.toString()!;
                    return relativePath;
                }));

        const result: { [path: string]: string } = {};
        await Promise.all(f
            .sort((a, b) => a.localeCompare(b))
            .map(async p => {
                let meta = nls.localize(
                    'vuengine/imageConvEditor/fileNotFound',
                    'File not found'
                );
                const resolvedUri = workspaceRootUri.resolve(p);
                if (await fileService.exists(resolvedUri)) {
                    const dimensions = await window.electronVesCore.getImageDimensions(resolvedUri.path.fsPath());
                    meta = `${dimensions.width}×${dimensions.height}`;
                }
                result[p] = meta;
            }));

        setFilesToShow(result);
    };

    useEffect(() => {
        determineFilesToShow();
    }, [
        data.files
    ]);

    const setImageConvData = (updatedData: Partial<ImageConfig>): void => {
        updateData({ ...data, ...updatedData });
    };

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
                                                fileUri={fileUri}
                                                fileService={fileService}
                                                fileDialogService={fileDialogService}
                                                messageService={messageService}
                                                workspaceService={workspaceService}
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
                                        fileService={fileService}
                                        workspaceService={workspaceService}
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
                    filesToShow,
                    setFilesToShow,
                    imageConvData: data,
                    setImageConvData,
                }}
            >
                <DockLayout
                    defaultLayout={defaultLayout}
                    dropMode="edge"
                    ref={getRef}
                    onLayoutChange={layout =>
                        localStorageService.setData(
                            ImageConvEditorLayoutStorageName,
                            layout
                        )
                    }
                />
            </ImageConvEditorContext.Provider>
        </div>
    );
}
