import { URI, nls } from '@theia/core';
import React, { useEffect, useState } from 'react';
import { ImageConfig } from '../../../../images/browser/ves-images-types';
import { EditorsServices } from '../../ves-editors-widget';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';
import Animation from './Animation/Animation';
import General from './General/General';
import { ImageConvEditorContext } from './ImageConvEditorTypes';
import Images from './Images/Images';
import Map from './TilesMap/Map';
import Tiles from './TilesMap/Tiles';

interface ImageConvEditorProps {
    data: ImageConfig
    updateData: (data: ImageConfig) => void
    fileUri: URI
    services: EditorsServices
}

export default function ImageConvEditor(props: ImageConvEditorProps): React.JSX.Element {
    const {
        data,
        updateData,
        fileUri,
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
                <VContainer gap={20}>
                    <General />
                    <HContainer gap={20} alignItems='start' wrap='wrap'>
                        <Tiles />
                        <Map />
                        <Animation />
                    </HContainer>
                    <Images
                        fileUri={fileUri}
                        fileService={services.fileService}
                        fileDialogService={services.fileDialogService}
                        messageService={services.messageService}
                        workspaceService={services.workspaceService}
                    />
                </VContainer>
            </ImageConvEditorContext.Provider>
        </div>
    );
}
