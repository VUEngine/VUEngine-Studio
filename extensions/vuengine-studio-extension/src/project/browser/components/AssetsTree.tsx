import { nls, URI } from '@theia/core';
import { OpenerService } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import React, { useEffect, useRef, useState } from 'react';
import { Tree } from 'react-arborist';
import Input from '../../../editors/browser/components/Common/Base/Input';
import RadioSelect from '../../../editors/browser/components/Common/Base/RadioSelect';
import VContainer from '../../../editors/browser/components/Common/Base/VContainer';
import { VesProjectService } from '../ves-project-service';
import { ProjectContributor, ProjectDataItem, ProjectDataItemsWithContributor, WithFileUri } from '../ves-project-types';
import AssetsTreeNode from './AssetsTreeNode';

interface TreeNode {
    id: string
    name: string
    isLeaf: boolean
    icon?: string
    children?: TreeNode[]
    handleClick?: (e: React.MouseEvent) => void
}

interface AssetsTreeProps {
    fileService: FileService
    openerService: OpenerService
    vesProjectService: VesProjectService
    workspaceService: WorkspaceService
}

export default function AssetsTree(props: AssetsTreeProps): React.JSX.Element {
    const { openerService, vesProjectService } = props;
    const treeContainerRef = useRef<HTMLDivElement>(null);
    const [treeHeight, setTreeHeight] = useState<number>(300);
    const [treeWidth, setTreeWidth] = useState<number>(300);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [contributorsFilter, setContributorsFilter] = useState<ProjectContributor[]>([ProjectContributor.Project]);
    const [treeData, setTreeData] = useState<TreeNode[]>([]);

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

            if (!type.file.startsWith('.')) {
                return;
            }

            const typeNode: TreeNode = {
                id: `type-${typeId}`,
                name: typeId,
                isLeaf: false,
                icon: type.icon,
                children: [],
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
                console.log('itemsMap', itemsMap);
                console.log('filteredItemsMap', filteredItemsMap);

                Object.keys(filteredItemsMap).forEach(itemId => {
                    const item = filteredItemsMap[itemId] as unknown as ProjectDataItem & WithFileUri;
                    typeNode.children!.push({
                        id: `item-${itemId}`,
                        name: item._fileUri.path.name,
                        isLeaf: true,
                        icon: type.icon,
                        handleClick: () => openEditor(item._fileUri),
                    });
                });
            }

            typeNode.children!.sort((a, b) => a.name.localeCompare(b.name));
            foundItems.push(typeNode);
        });

        foundItems.sort((a, b) => a.name.localeCompare(b.name));
        setTreeData(foundItems);
    };

    useEffect(() => {
        getItems();
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
                            data={treeData}
                            indent={20}
                            rowHeight={24}
                            height={treeHeight}
                            width={treeWidth}
                            openByDefault={false}
                            disableDrag
                            disableDrop
                            disableEdit
                            disableMultiSelection
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
