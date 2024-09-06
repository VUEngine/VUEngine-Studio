import { Image, Images as ImagesIcon } from '@phosphor-icons/react';
import { MaybeArray, URI, isWindows, nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import React, { useContext, useEffect, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';

interface ImagesProps {
    data: string[]
    updateData?: (data: string[]) => void
    canSelectMany: boolean
    allInFolderAsFallback: boolean
    stack: boolean
    showMetaData: boolean
    absolutePaths?: boolean
    containerHeight?: string
    containerWidth?: string
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
        absolutePaths,
        containerHeight,
        containerWidth,
        fileAddExtraAction
    } = props;
    const [filesToShow, setFilesToShow] = useState<{ [path: string]: string }>({});

    const fileAddOnClick = () => {
        if (!updateData) {
            return;
        }

        selectFiles();
        if (fileAddExtraAction) {
            fileAddExtraAction();
        }
    };

    const determineFilesToShow = async () => {
        const files = data.length > 0
            ? data
            : allInFolderAsFallback
                ? await Promise.all(window.electronVesCore.findFiles(await services.fileService.fsPath(fileUri.parent), '*.png')
                    .map(async p => {
                        const fullUri = fileUri.parent.resolve(p);
                        const relativePath = fileUri.parent.relative(fullUri)?.toString()!;
                        return relativePath;
                    }))
                : [];

        const result: { [path: string]: string } = {};
        await Promise.all(files
            .sort((a, b) => a.localeCompare(b))
            .map(async (p, i) => {
                if (stack && i > 0) {
                    return;
                }

                let meta = nls.localize(
                    'vuengine/imageEditor/fileNotFound',
                    'File not found'
                );
                const resolvedUri = fileUri.parent.resolve(p);
                if (!p.startsWith('data:') && showMetaData) {
                    const exists = await services.fileService.exists(resolvedUri);
                    if (exists) {
                        const dimensions = window.electronVesCore.getImageDimensions(resolvedUri.path.fsPath());
                        meta = `${dimensions.width}×${dimensions.height}`;
                    }
                } else {
                    meta = '';
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

    const confirmSaveCopy = async (sourceUri: URI, targetUri: URI): Promise<boolean> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/imageEditor/saveCopy', 'Save Copy'),
            msg: nls.localize(
                'vuengine/imageEditor/areYouSureYouWantToSaveACopy',
                "Only files below the current file's folder can be used. " +
                'Do you want to save a copy of "{0}" to be able to use this file?',
                targetUri.path.base
            ),
            maxWidth: 400,
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            // TODO: the save dialog must not allow to navigate out of the workspace
            /*
            const saveFilterDialogProps: SaveFileDialogProps = {
                title: nls.localize('vuengine/imageEditor/saveCopy', 'Save Copy'),
                inputValue: filename,
                filters: { 'PNG': ['png'] }
            };
            const selected = await services.fileDialogService.showSaveDialog(
                saveFilterDialogProps,
                baseFolder
            );
            */
            try {
                await services.fileService.copy(sourceUri, targetUri);
            } catch (error) {
                return false;
            }

            return true;
        }

        return false;
    };

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
            await Promise.all(uris.map(async uri => {
                const source = await services.fileService.resolve(uri);
                if (source.isFile) {
                    if (absolutePaths) {
                        newFiles.push(uri.path.fsPath());
                    } else {
                        const relativePath = fileUri.parent.relative(uri);
                        if (!relativePath) {
                            const targetUri = fileUri.parent.resolve(source.resource.path.base);
                            const relativeTargetFilePath = fileUri.parent.relative(targetUri)?.toString().replace(/\\/g, '/');
                            const confirmed = await confirmSaveCopy(uri as URI, targetUri);
                            if (confirmed && relativeTargetFilePath) {
                                newFiles.push(relativeTargetFilePath);
                            }
                        } else {
                            newFiles.push(relativePath.toString().replace(/\\/g, '/'));
                        }
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

        if (updateData) {
            updateData(updatedFiles);
        }
    };

    const removeFile = async (path: string) => {
        if (updateData) {
            updateData(stack ? [] : data.filter((f, i) => f !== path));
        }
    };

    return <HContainer
        gap={15}
        grow={1}
        overflow={stack ? 'visible' : 'auto'}
        wrap="wrap"
        style={{
            // @ts-ignore
            '--ves-file-height': containerHeight,
            '--ves-file-width': containerWidth,
        }}
    >
        {Object.keys(filesToShow).map((f, i) => {
            const fullUri = absolutePaths ? new URI(f) : fileUri.parent.resolve(f);
            const imageUrl = f.startsWith('data:')
                ? f
                : isWindows
                    ? `/${fullUri.path.fsPath()}`.replace(/\\/g, '/')
                    : fullUri.path.fsPath();
            return <div
                key={`image-${i}`}
                className={`filePreview${stack && data.length > 1 ? ' multi' : ''}`}
                title={f.startsWith('data:') ? undefined : f}
            >
                <div className='filePreviewImage' style={{ backgroundImage: `url('${imageUrl}')` }}>
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
                {updateData &&
                    <div
                        className="filePreviewActions"
                        title="Remove Image"
                        onClick={() => removeFile(f)}
                    >
                        <i className="codicon codicon-x" />
                    </div>
                }
            </div>;
        })}
        {(allInFolderAsFallback || !Object.keys(filesToShow).length) &&
            <div className={updateData ? 'fileAdd' : 'fileAdd disabled'} onClick={fileAddOnClick}>
                {canSelectMany
                    ? <ImagesIcon size={20} />
                    : <Image size={20} />
                }
            </div>
        }
    </HContainer>;
}
