import { MaybeArray, MessageService, URI, nls } from '@theia/core';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import React, { useContext } from 'react';
import { ImageConfig } from 'src/images/browser/ves-images-types';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { ImageConvEditorContext, ImageConvEditorContextType } from '../ImageConvEditorTypes';

interface ImagesProps {
    fileUri: URI
    fileService: FileService,
    fileDialogService: FileDialogService,
    messageService: MessageService,
    workspaceService: WorkspaceService,
}

export default function Images(props: ImagesProps): React.JSX.Element {
    const { fileUri, fileService, fileDialogService, messageService, workspaceService } = props;
    const { filesToShow, imageConvData, setImageConvData } = useContext(ImageConvEditorContext) as ImageConvEditorContextType;
    const workspaceRootUri = workspaceService.tryGetRoots()[0]?.resource;

    const selectFiles = async (): Promise<void> => {
        const openFileDialogProps: OpenFileDialogProps = {
            title: nls.localize('vuengine/imageConvEditor/selectFiles', 'Select files'),
            canSelectFolders: false,
            canSelectFiles: true,
            canSelectMany: true,
            filters: { 'PNG': ['png'] }
        };
        const currentPath = await fileService.resolve(fileUri.parent);
        let uris: MaybeArray<URI> | undefined = await fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
        if (uris) {
            const newFiles: string[] = [];
            if (!Array.isArray(uris)) {
                uris = [uris];
            }
            await Promise.all(uris.map(async u => {
                const source = await fileService.resolve(u);
                if (source.isFile) {
                    const relativePath = workspaceRootUri.relative(u);
                    if (!relativePath) {
                        messageService.error(
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
        const updateData: Partial<ImageConfig> = {
            files: [...new Set([
                ...imageConvData.files,
                ...newFiles,
            ].sort())],
        };

        if (imageConvData.name === '' && updateData.files?.length) {
            const name = workspaceRootUri.resolve(updateData.files[0]).path.name.replace(/([A-Z])/g, ' $1').trim();
            updateData.name = name;
        }

        setImageConvData(updateData);
    };

    const removeFile = async (path: string) => {
        setImageConvData({
            files: imageConvData.files.filter((f, i) => f !== path),
        });
    };

    return <VContainer gap={10}>
        <label>
            {nls.localize('vuengine/imageConvEditor/files', 'Files')}
        </label>
        {imageConvData.files.length === 0
            && <div style={{ fontStyle: 'italic' }}>
                <i className='codicon codicon-info' style={{ verticalAlign: 'bottom' }} />{' '}
                {nls.localize(
                    'vuengine/imageConvEditor/noFilesSelected',
                    'No images selected. All images in this folder will be converted.'
                )}
            </div>
        }
        <HContainer alignItems="start" gap={15} wrap="wrap">
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
            <div className='fileAdd' onClick={selectFiles}>
                <i className="codicon codicon-add" />
            </div>
        </HContainer>
    </VContainer>;
}