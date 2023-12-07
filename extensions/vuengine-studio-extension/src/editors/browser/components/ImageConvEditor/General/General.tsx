import { MessageService, URI, nls } from '@theia/core';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import React, { useContext } from 'react';
import { DataSection } from '../../Common/CommonTypes';
import VContainer from '../../Common/VContainer';
import { ImageConvEditorContext, ImageConvEditorContextType } from '../ImageConvEditorTypes';
import HContainer from '../../Common/HContainer';
import { ImageConfig } from 'src/images/browser/ves-images-types';

interface GeneralProps {
    fileUri: URI
    fileService: FileService,
    fileDialogService: FileDialogService,
    messageService: MessageService,
    workspaceService: WorkspaceService,
}

export default function General(props: GeneralProps): React.JSX.Element {
    const { fileUri, fileService, fileDialogService, messageService, workspaceService } = props;
    const { imageConvData, setImageConvData } = useContext(ImageConvEditorContext) as ImageConvEditorContextType;

    const setName = (n: string): void => {
        setImageConvData({ name: n.trim() });
    };

    const selectSourceFile = async (): Promise<void> => {
        const openFileDialogProps: OpenFileDialogProps = {
            title: nls.localize('vuengine/imageConvEditor/selectSourceFile', 'Select source file'),
            canSelectFolders: false,
            canSelectFiles: true,
            filters: { 'PNG': ['.png'] }
        };
        const currentPath = await fileService.resolve(fileUri.parent);
        const uri = await fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
        if (uri) {
            const workspaceRootUri = workspaceService.tryGetRoots()[0]?.resource;
            const source = await fileService.resolve(uri);
            if (source.isFile) {
                const relativeUri = workspaceRootUri.relative(uri);
                if (!relativeUri) {
                    messageService.error(
                        nls.localize('vuengine/imageConvEditor/errorSourceFileMustBeInWorkspace', 'Source file must live in workspace.')
                    );
                } else {
                    setSourceFile(relativeUri.fsPath());
                }
            }
        }
    };

    const setSourceFile = async (sourceFile: string) => {
        const workspaceRootUri = workspaceService.tryGetRoots()[0]?.resource;
        const name = workspaceRootUri.resolve(sourceFile).path.name.replace(/([A-Z])/g, ' $1').trim();

        const updateData: Partial<ImageConfig> = {
            files: [sourceFile]
        };

        if (sourceFile) {
            updateData.name = name;
        }

        setImageConvData(updateData);
    };

    const setSection = (section: DataSection) => {
        setImageConvData({
            section,
        });
    };

    return <VContainer gap={10}>
        <VContainer>
            <label>
                {nls.localize('vuengine/imageConvEditor/name', 'Name')}
            </label>
            <input
                className='theia-input large'
                value={imageConvData.name}
                onChange={e => setName(e.target.value)}
            />
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/imageConvEditor/path', 'Path')}
            </label>
            <HContainer>
                <input
                    type="text"
                    className="theia-input"
                    style={{ flexGrow: 1 }}
                    value={imageConvData.files[0]}
                    onBlur={e => setSourceFile(e.target.value)}
                    onChange={e => setSourceFile(e.target.value)}
                />
                <button
                    className="theia-button secondary"
                    style={{ marginLeft: 0 }}
                    onClick={selectSourceFile}
                >
                    <i className="fa fa-ellipsis-h" />
                </button>
            </HContainer>
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/imageConvEditor/section', 'Section')}
            </label>
            <SelectComponent
                defaultValue={imageConvData.section}
                options={[{
                    label: nls.localize('vuengine/imageConvEditor/romSpace', 'ROM Space'),
                    value: DataSection.ROM,
                    description: nls.localize('vuengine/imageConvEditor/romSpaceDescription', 'Save image data to ROM space'),
                }, {
                    label: nls.localize('vuengine/imageConvEditor/expansionSpace', 'Expansion Space'),
                    value: DataSection.EXP,
                    description: nls.localize('vuengine/imageConvEditor/expansionSpaceDescription', 'Save image data to expansion space'),
                }]}
                onChange={option => setSection(option.value as DataSection)}
            />
        </VContainer>
    </VContainer>;
}
