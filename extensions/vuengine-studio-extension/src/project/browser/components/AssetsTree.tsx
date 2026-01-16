import { nls, URI } from '@theia/core';
import { ConfirmDialog, open, OpenerService } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import React, { useEffect, useRef, useState } from 'react';
import { Tree } from 'react-arborist';
import Input from '../../../editors/browser/components/Common/Base/Input';
import RadioSelect from '../../../editors/browser/components/Common/Base/RadioSelect';
import VContainer from '../../../editors/browser/components/Common/Base/VContainer';
import { VesProjectService } from '../ves-project-service';
import { ProjectContributor, ProjectDataItem, ProjectDataItemsWithContributor, WithContributor, WithFileUri } from '../ves-project-types';
import AssetsTreeNode from './AssetsTreeNode';

interface TreeNode {
    id: string
    name: string
    contributor: ProjectContributor
    isLeaf: boolean
    icon?: string
    children?: TreeNode[]
    handleClick?: (e: React.MouseEvent) => void
    add?: () => void
    clone?: () => void
    remove?: () => void
}

interface AssetsTreeProps {
    allExpanded: boolean
    fileService: FileService
    openerService: OpenerService
    vesProjectService: VesProjectService
    workspaceService: WorkspaceService
}

export default function AssetsTree(props: AssetsTreeProps): React.JSX.Element {
    const {
        allExpanded,
        fileService, openerService, vesProjectService, // workspaceService,
    } = props;
    const treeContainerRef = useRef<HTMLDivElement>(null);
    const [treeHeight, setTreeHeight] = useState<number>(300);
    const [treeWidth, setTreeWidth] = useState<number>(300);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selection, setSelection] = useState<string>('');
    const [contributorsFilter, setContributorsFilter] = useState<ProjectContributor[]>([ProjectContributor.Project]);
    const [treeData, setTreeData] = useState<TreeNode[]>([]);
    const treeRef = useRef();

    /*
    const open = async (type: ProjectDataType & WithContributor, item?: ProjectDataItem & WithFileUri): Promise<void> => {
        if (item && item._fileUri) {
            openEditor(item._fileUri);
        } else if (!type.file.startsWith('.')) {
            const workspaceRootUri = workspaceService.tryGetRoots()[0]?.resource;
            const newFileUri = workspaceRootUri.resolve('config').resolve(type.file);

            if (!(await fileService.exists(newFileUri))) {
                const data = await vesProjectService.getSchemaDefaults(type);
                await fileService.create(newFileUri, stringify(data));
            }

            openEditor(newFileUri);
        }
    };
    */

    const openEditor = async (fileUri: URI): Promise<void> => {
        const opener = await openerService.getOpener(fileUri);
        await opener.open(fileUri);
    };

    const getItems = async () => {
        await vesProjectService.projectDataReady;
        const types = vesProjectService.getProjectDataTypes();
        if (types === undefined) {
            return;
        }

        const foundItems: TreeNode[] = [];
        Object.keys(types).forEach(typeId => {
            const type = types[typeId];

            if (!type.file.startsWith('.') || (type.enabled !== undefined && type.enabled === false)) {
                return;
            }

            const typeNode: TreeNode = {
                id: `type-${typeId}`,
                name: typeId,
                contributor: type._contributor,
                isLeaf: false,
                icon: type.icon,
                children: [],
                add: () => addItem(typeId)
            };

            const itemsMap = vesProjectService.getProjectDataItemsForType(typeId);
            if (itemsMap !== undefined) {
                const filteredItemsMap: ProjectDataItemsWithContributor = {};
                Object.keys(itemsMap).forEach(itemId => {
                    const item = itemsMap[itemId];
                    contributorsFilter.forEach(cf => {
                        if (item._contributor.startsWith(cf)) {
                            filteredItemsMap[itemId] = item;
                        }
                    });
                });

                Object.keys(filteredItemsMap).forEach(itemId => {
                    const item = filteredItemsMap[itemId] as unknown as ProjectDataItem & WithFileUri & WithContributor;
                    const node: TreeNode = {
                        id: `item-${itemId}`,
                        name: item._fileUri.path.name,
                        contributor: item._contributor,
                        isLeaf: true,
                        icon: type.icon,
                        handleClick: () => openEditor(item._fileUri),
                        clone: () => addItem(typeId, itemId)
                    };
                    if (item._contributor === ProjectContributor.Project) {
                        node.remove = () => removeItem(item._fileUri);
                    }
                    typeNode.children!.push(node);
                });
            }

            typeNode.children!.sort((a, b) => a.name.localeCompare(b.name));
            foundItems.push(typeNode);
        });

        foundItems.sort((a, b) => a.name.localeCompare(b.name));
        setTreeData(foundItems);
    };

    const removeItem = async (fileUri: URI) => {
        const dialog = new ConfirmDialog({
            title: nls.localizeByDefault('Remove'),
            msg: nls.localize('vuengine/projects/areYouSureYouWantToRemoveItem', 'Are you sure you want to remove {0}?', fileUri.path.base),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            await fileService.delete(fileUri);
        }
    };

    const addItem = async (typeId: string, itemIdToClone?: string) => {
        const result = await vesProjectService.createNewFileForType(typeId, itemIdToClone);
        if (result !== undefined) {
            const newItemId = result.data._id;
            setSelection(`item-${newItemId}`);
            await open(openerService, result.fileUri);
        }
    };

    useEffect(() => {
        getItems();
        const addObserver = vesProjectService.onDidAddProjectItem(() => getItems());
        const deleteObserver = vesProjectService.onDidDeleteProjectItem(() => getItems());
        const updateObserver = vesProjectService.onDidUpdateProjectItem(() => getItems());
        return () => {
            addObserver.dispose();
            deleteObserver.dispose();
            updateObserver.dispose();
        };
    }, [
        contributorsFilter
    ]);

    useEffect(() => {
        if (!treeContainerRef.current) {
            return;
        }
        const resizeObserver = new ResizeObserver(() => {
            setTreeWidth(treeContainerRef.current?.clientWidth ?? treeHeight);
            setTreeHeight(treeContainerRef.current?.clientHeight ?? treeWidth);
        });
        resizeObserver.observe(treeContainerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    return (
        <VContainer gap={10} grow={1} overflow='hidden'>
            <VContainer style={{
                padding: '0 calc(2 * var(--theia-ui-padding))',
            }}>
                <Input
                    value={searchTerm}
                    setValue={v => setSearchTerm(v as string)}
                    placeholder={nls.localize('vuengine/editors/project/enterSearchTerm', 'Enter Search Term...')}
                    grow={1}
                />
                <RadioSelect
                    options={[{
                        value: ProjectContributor.Project,
                        label: nls.localize('vuengine/editors/projects/project', 'Project'),
                    }, {
                        value: ProjectContributor.Engine,
                        label: nls.localize('vuengine/editors/projects/engine', 'Engine'),
                    }, {
                        value: ProjectContributor.Plugin,
                        label: nls.localize('vuengine/editors/projects/plugins', 'Plugins'),
                    }]}
                    defaultValue={contributorsFilter}
                    onChange={options => setContributorsFilter(options.map(o => o.value) as ProjectContributor[])}
                    canSelectMany
                    fitSpace
                />
            </VContainer>
            <VContainer
                grow={1}
                style={{
                    overflow: 'auto',
                    paddingBottom: 'var(--padding)',
                }}
            >
                <div
                    className='ves-tree'
                    ref={treeContainerRef}
                    style={{
                        // @ts-ignore
                        '--padding': 'calc(2 * var(--theia-ui-padding))',
                        display: 'flex',
                        flexGrow: 1,
                    }}
                >
                    {treeData.length === 0
                        ? <div style={{ padding: '0 calc(2 * var(--theia-ui-padding))' }}>
                            {nls.localize('vuengine/editors/project/noAssetsFound', 'No Assets Found')}
                        </div>
                        : <Tree
                            ref={treeRef}
                            data={treeData}
                            indent={20}
                            rowHeight={24}
                            height={treeHeight}
                            width={treeWidth}
                            openByDefault={allExpanded}
                            disableDrag
                            disableDrop
                            disableMultiSelection
                            selection={selection}
                            searchTerm={searchTerm}
                        >
                            {AssetsTreeNode}
                        </Tree>
                    }
                </div>
            </VContainer>
        </VContainer>
    );
}
