import { MaybeArray, URI, nls } from '@theia/core';
import { OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import React, { useEffect, useState } from 'react';
import { EditorsServices } from '../../../ves-editors-widget';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';

interface ImagesProps {
    data: string[]
    updateData: (data: string[]) => void
    canSelectMany: boolean,
    allInFolderAsFallback: boolean,
    fileUri: URI
    services: EditorsServices,
}

export default function Images(props: ImagesProps): React.JSX.Element {
    const { data, updateData, canSelectMany, allInFolderAsFallback, fileUri, services } = props;
    const [filesToShow, setFilesToShow] = useState<{ [path: string]: string }>({});
    const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;

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
        data
    ]);

    const selectFiles = async (): Promise<void> => {
        const openFileDialogProps: OpenFileDialogProps = {
            title: nls.localize('vuengine/imageConvEditor/selectFiles', 'Select files'),
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
                            nls.localize('vuengine/imageConvEditor/errorSourceFileMustBeInWorkspace', 'Source file must live in workspace.')
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
        updateData(data.filter((f, i) => f !== path));
    };

    return <VContainer gap={10} overflow='hidden'>
        <label>
            {canSelectMany
                ? nls.localize('vuengine/imageConvEditor/xFiles', 'Image Files ({0})', Object.keys(filesToShow).length)
                : nls.localize('vuengine/imageConvEditor/file', 'Image File')
            }
        </label>
        {data.length === 0 && allInFolderAsFallback &&
            <div style={{ fontStyle: 'italic' }}>
                <i className='codicon codicon-info' style={{ verticalAlign: 'bottom' }} />{' '}
                {nls.localize(
                    'vuengine/imageConvEditor/noFilesSelected',
                    'No images selected. All images in this folder will be converted.'
                )}
            </div>
        }
        <HContainer alignItems="start" gap={15} overflow='auto' wrap="wrap">
            {Object.keys(filesToShow).map((f, i) => {
                const fullUri = workspaceRootUri.resolve(f);
                return <div
                    key={`image-${i}`}
                    className='filePreview'
                    title={f}
                >
                    <div className='filePreviewImage'>
                        <img src={fullUri.path.fsPath()} />
                    </div>
                    <div className='filePreviewTitle'>
                        {fullUri.path.base}
                    </div>
                    <div className='filePreviewMeta'>
                        {filesToShow[f]}
                    </div>
                    <div className='filePreviewActions'>
                        <i
                            className="fa fa-trash"
                            onClick={() => removeFile(f)}
                        />
                    </div>
                </div>;
            })}
            {(allInFolderAsFallback || !Object.keys(filesToShow).length) &&
                <div className='fileAdd' onClick={selectFiles}>
                    <i className="codicon codicon-add" />
                </div>
            }
        </HContainer>
    </VContainer>;
}
