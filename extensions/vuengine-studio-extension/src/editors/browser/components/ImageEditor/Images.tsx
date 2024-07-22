import { Image, Images as ImagesIcon } from '@phosphor-icons/react';
import { MaybeArray, URI, nls } from '@theia/core';
import { OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';
import { getMaxScaleInContainer } from '../Common/Utils';

interface ImagesProps {
    data: string[]
    updateData: (data: string[]) => void
    canSelectMany: boolean
    allInFolderAsFallback: boolean
    stack: boolean
    showMetaData: boolean
    containerHeight?: number
    containerWidth?: number
    height?: number
    width?: number
    fileAddExtraAction?: () => void
}

export default function Images(props: ImagesProps): React.JSX.Element {
    const { fileUri, services } = useContext(EditorsContext) as EditorsContextType;
    const {
        data,
        updateData,
        canSelectMany,
        allInFolderAsFallback,
        stack,
        showMetaData,
        containerHeight,
        containerWidth,
        height,
        width,
        fileAddExtraAction
    } = props;
    const [filesToShow, setFilesToShow] = useState<{ [path: string]: string }>({});
    const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;

    const fileAddOnClick = () => {
        selectFiles();
        if (fileAddExtraAction) {
            fileAddExtraAction();
        }
    };

    const determineFilesToShow = async () => {
        const f = data.length > 0
            ? data
            : allInFolderAsFallback
                ? await Promise.all(window.electronVesCore.findFiles(await services.fileService.fsPath(fileUri.parent), '*.png')
                    .map(async p => {
                        const fullUri = fileUri.parent.resolve(p);
                        const relativePath = workspaceRootUri.relative(fullUri)?.toString()!;
                        return relativePath;
                    }))
                : [];

        const result: { [path: string]: string } = {};
        f.sort((a, b) => a.localeCompare(b)).map(async (p, i) => {
            if (stack && i > 0) {
                return;
            }

            let meta = nls.localize(
                'vuengine/imageEditor/fileNotFound',
                'File not found'
            );
            const resolvedUri = workspaceRootUri.resolve(p);
            if (showMetaData) {
                const dimensions = window.electronVesCore.getImageDimensions(resolvedUri.path.fsPath());
                meta = `${dimensions.width}×${dimensions.height}`;
            } else {
                meta = '';
            }
            result[p] = meta;
        });

        setFilesToShow(result);
    };

    useEffect(() => {
        determineFilesToShow();
    }, [
        data
    ]);

    const selectFiles = async (): Promise<void> => {
        const openFileDialogProps: OpenFileDialogProps = {
            title: nls.localize('vuengine/imageEditor/selectFiles', 'Select files'),
            canSelectFolders: false,
            canSelectFiles: true,
            canSelectMany,
            filters: { 'PNG': ['png'] }
        };
        const currentPath = await services.fileService.resolve(fileUri.parent);
        let uris: MaybeArray<URI> | undefined = await services.fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
        if (uris) {
            const newFiles: string[] = [];
            if (!Array.isArray(uris)) {
                uris = [uris];
            }
            await Promise.all(uris.map(async u => {
                const source = await services.fileService.resolve(u);
                if (source.isFile) {
                    const relativePath = workspaceRootUri.relative(u);
                    if (!relativePath) {
                        services.messageService.error(
                            nls.localize('vuengine/imageEditor/errorSourceFileMustBeInWorkspace', 'Source file must live in workspace.')
                        );
                    } else {
                        newFiles.push(relativePath.toString().replace(/\\/g, '/'));
                    }
                }
            }));
            addFiles(newFiles);
        }
    };

    const addFiles = async (newFiles: string[]) => {
        const updatedFiles = [...new Set([
            ...data,
            ...newFiles,
        ].sort())];

        updateData(updatedFiles);
    };

    const removeFile = async (path: string) => {
        if (stack) {
            updateData([]);
        } else {
            updateData(data.filter((f, i) => f !== path));
        }
    };

    const scale = useMemo(() => getMaxScaleInContainer(containerHeight ?? 64, containerWidth ?? 64, height ?? 64, width ?? 64),
        [
            containerHeight,
            containerWidth,
            height,
            width
        ]);

    return <HContainer
        alignItems="start"
        gap={15}
        overflow={stack ? 'visible' : 'auto'}
        wrap="wrap"
        style={{
            // @ts-ignore
            '--ves-file-height': containerHeight ? `${containerHeight}px` : undefined,
            '--ves-file-width': containerWidth ? `${containerWidth}px` : undefined,
        }}
    >
        {Object.keys(filesToShow).map((f, i) => {
            const fullUri = workspaceRootUri.resolve(f);
            return <div
                key={`image-${i}`}
                className={`filePreview${stack && data.length > 1 ? ' multi' : ''}`}
                title={f}
            >
                <div className='filePreviewImage'>
                    <img src={fullUri.path.fsPath()} style={{
                        transform: `scale(${scale})`
                    }} />
                </div>
                {(showMetaData || filesToShow[f]) &&
                    <VContainer gap={2}>
                        <div className='filePreviewTitle'>
                            {showMetaData && <>
                                {fullUri.path.base}
                                {stack && data.length > 1 && ' +' + (data.length - 1)}
                            </>}
                        </div>
                        <div className='filePreviewMeta'>
                            {filesToShow[f]}
                        </div>
                    </VContainer>
                }
                <div
                    className="filePreviewActions"
                    title="Remove Image"
                    onClick={() => removeFile(f)}
                >
                    <i className="codicon codicon-x" />
                </div>
                {scale !== 1 &&
                    <div
                        className="fileZoom"
                        title="Preview Zoom"
                    >
                        <i className="codicon codicon-zoom-in" /> {scale}
                    </div>
                }
            </div>;
        })}
        {(allInFolderAsFallback || !Object.keys(filesToShow).length) &&
            <div className='fileAdd' onClick={fileAddOnClick}>
                {canSelectMany
                    ? <ImagesIcon size={20} />
                    : <Image size={20} />
                }
            </div>
        }
    </HContainer>;
}
