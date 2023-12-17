import { URI, nls } from '@theia/core';
import DockLayout, { LayoutData } from 'rc-dock';
import React, { useEffect, useState } from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';
import { EditorsDockInterface, EditorsServices } from '../../ves-editors-widget';
import Animation from './Animation/Animation';
import General from './General/General';
import { ImageConvEditorContext } from './ImageConvEditorTypes';
import Preview from './Preview/Preview';
import TilesMap from './TilesMap/TilesMap';

interface ImageConvEditorDockProps {
    data: ImageConfig
    updateData: (data: ImageConfig) => void
    fileUri: URI
    dock: EditorsDockInterface
    services: EditorsServices
}

export default function ImageConvEditorDock(props: ImageConvEditorDockProps): React.JSX.Element {
    const {
        data,
        updateData,
        fileUri,
        dock,
        services,
    } = props;
    const [filesToShow, setFilesToShow] = useState<{ [path: string]: string }>({});
    const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;

    const determineFilesToShow = async () => {
        const f = data.files.length > 0
            ? data.files
            : await Promise.all(window.electronVesCore.findFiles(await services.fileService.fsPath(fileUri.parent), '*.png')
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
                if (await services.fileService.exists(resolvedUri)) {
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
                                                fileService={services.fileService}
                                                fileDialogService={services.fileDialogService}
                                                messageService={services.messageService}
                                                workspaceService={services.workspaceService}
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
                                        fileService={services.fileService}
                                        workspaceService={services.workspaceService}
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
                    ref={dock.getRef}
                    onLayoutChange={dock.persistLayout}
                />
            </ImageConvEditorContext.Provider>
        </div>
    );
}
