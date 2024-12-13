import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { Tree } from 'react-arborist';
import { WithFileUri } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/Base/VContainer';
import { ComponentKey, EntityData, EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import ComponentTreeNode from './ComponentTreeNode';

interface ComponentType {
    key: ComponentKey | 'extraProperties' | 'physics'
    componentKey?: ComponentKey
    labelSingular: string
    labelPlural: string
    hasContent: boolean
}

interface TreeNode {
    id: string
    name: string
    children?: TreeNode[]
}

export default function ComponentTree(): React.JSX.Element {
    const { currentComponent } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const moveComponent = (
        dragIds: string[],
        parentId: string,
        targetIndex: number,
    ): void => {
        const [type, indexString] = dragIds[0].split('-');
        const currentIndex = parseInt(indexString || '-1');

        if (type === parentId) {
            // @ts-ignore
            const componentsOfType = [...data.components[type]];
            const removedItem = componentsOfType.splice(currentIndex, 1).pop();
            componentsOfType.splice(targetIndex > currentIndex
                ? targetIndex - 1
                : targetIndex, 0, removedItem
            );
            setData({
                components: {
                    ...data.components,
                    [type]: componentsOfType,
                }
            });
        }
    };

    const componentTypes: ComponentType[] = [
        {
            key: 'sprites',
            componentKey: 'sprites',
            labelSingular: nls.localize('vuengine/entityEditor/sprite', 'Sprite'),
            labelPlural: nls.localize('vuengine/entityEditor/sprites', 'Sprites'),
            hasContent: data.components?.sprites?.length > 0,
        },
        {
            key: 'animations',
            componentKey: 'animations',
            labelSingular: nls.localize('vuengine/entityEditor/animation', 'Animation'),
            labelPlural: nls.localize('vuengine/entityEditor/animations', 'Animations'),
            hasContent: data.components?.animations?.length > 0,
        },
        {
            key: 'colliders',
            componentKey: 'colliders',
            labelSingular: nls.localize('vuengine/entityEditor/collider', 'Collider'),
            labelPlural: nls.localize('vuengine/entityEditor/colliders', 'Colliders'),
            hasContent: data.components?.colliders?.length > 0,
        },
        {
            key: 'wireframes',
            componentKey: 'wireframes',
            labelSingular: nls.localize('vuengine/entityEditor/wireframe', 'Wireframe'),
            labelPlural: nls.localize('vuengine/entityEditor/wireframes', 'Wireframes'),
            hasContent: data.components?.wireframes?.length > 0,
        },
        {
            key: 'behaviors',
            componentKey: 'behaviors',
            labelSingular: nls.localize('vuengine/entityEditor/behavior', 'Behavior'),
            labelPlural: nls.localize('vuengine/entityEditor/behaviors', 'Behaviors'),
            hasContent: data.components?.behaviors?.length > 0,
        },
        {
            key: 'children',
            componentKey: 'children',
            labelSingular: nls.localize('vuengine/entityEditor/child', 'Child'),
            labelPlural: nls.localize('vuengine/entityEditor/children', 'Children'),
            hasContent: data.components?.children?.length > 0,
        },
        {
            key: 'scripts',
            componentKey: 'scripts',
            labelSingular: nls.localize('vuengine/entityEditor/script', 'Script'),
            labelPlural: nls.localize('vuengine/entityEditor/scripts', 'Scripts'),
            hasContent: data.components?.scripts?.length > 0,
        },
        {
            key: 'physics',
            labelSingular: nls.localize('vuengine/entityEditor/physics', 'Physical Properties'),
            labelPlural: nls.localize('vuengine/entityEditor/physics', 'Physical Properties'),
            hasContent: data.physics.enabled,
        },
        {
            key: 'extraProperties',
            labelSingular: nls.localize('vuengine/entityEditor/extraProperties', 'Extra Properties'),
            labelPlural: nls.localize('vuengine/entityEditor/extraProperties', 'Extra Properties'),
            hasContent: data.extraProperties.enabled,
        },
    ];

    const treeData: TreeNode[] = [];
    componentTypes
        .sort((a, b) => a.labelPlural.localeCompare(b.labelPlural))
        .map(componentType => {
            if (componentType.hasContent) {
                const newEntry: TreeNode = {
                    id: componentType.key,
                    name: componentType.labelPlural,
                };
                if (componentType.componentKey && data.components[componentType.componentKey]) {
                    const newEntryChildren: TreeNode[] = [];
                    data.components[componentType.componentKey].map((c, i) => {
                        const fallbackName = `${componentType.labelSingular} ${i + 1}`;
                        let name = c.name ?? fallbackName;

                        if (componentType.key === 'children') {
                            // @ts-ignore
                            const entityItem = services.vesProjectService.getProjectDataItemById(c.itemId, 'Entity') as EntityData & WithFileUri;
                            if (entityItem) {
                                name = entityItem._fileUri.path.name;
                            }
                        }

                        newEntryChildren.push({
                            id: `${componentType.key}-${i}`,
                            name,
                        });
                    });
                    newEntry.children = newEntryChildren;
                }
                treeData.push(newEntry);
            }
        });

    treeData.push({
        id: 'addComponent',
        name: nls.localize('vuengine/editors/addComponent', 'Add Component'),
    });

    return (
        <VContainer
            style={{
                overflow: 'hidden',
                zIndex: 1,
            }}
        >
            <label style={{
                padding: 'var(--padding) var(--padding) 0',
            }}>
                {nls.localize('vuengine/entityEditor/components', 'Components')}
            </label>
            <div className='ves-tree' style={{
                overflow: 'auto',
                paddingBottom: 'var(--padding)',
            }}>
                <Tree
                    data={treeData}
                    indent={24}
                    rowHeight={24}
                    openByDefault={true}
                    width='100%'
                    onMove={({ dragIds, parentId, index }) => moveComponent(dragIds, parentId!, index)}
                    selection={currentComponent.split('-', 2).join('-')} // ignore sub selections
                >
                    {ComponentTreeNode}
                </Tree>
            </div>
        </VContainer>
    );
}
