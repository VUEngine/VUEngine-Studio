import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { Tree } from 'react-arborist';
import { WithFileUri } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/Base/VContainer';
import { ComponentKey, ActorData, ActorEditorContext, ActorEditorContextType } from '../ActorEditorTypes';
import ComponentTreeNode from './ComponentTreeNode';

interface ComponentType {
    key: ComponentKey | 'extraProperties' | 'body'
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
    const { currentComponent } = useContext(ActorEditorContext) as ActorEditorContextType;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, setData } = useContext(ActorEditorContext) as ActorEditorContextType;

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
            labelSingular: nls.localize('vuengine/actorEditor/sprite', 'Sprite'),
            labelPlural: nls.localize('vuengine/actorEditor/sprites', 'Sprites'),
            hasContent: data.components?.sprites?.length > 0,
        },
        {
            key: 'animations',
            componentKey: 'animations',
            labelSingular: nls.localize('vuengine/actorEditor/animation', 'Animation'),
            labelPlural: nls.localize('vuengine/actorEditor/animations', 'Animations'),
            hasContent: data.components?.animations?.length > 0,
        },
        {
            key: 'colliders',
            componentKey: 'colliders',
            labelSingular: nls.localize('vuengine/actorEditor/collider', 'Collider'),
            labelPlural: nls.localize('vuengine/actorEditor/colliders', 'Colliders'),
            hasContent: data.components?.colliders?.length > 0,
        },
        {
            key: 'wireframes',
            componentKey: 'wireframes',
            labelSingular: nls.localize('vuengine/actorEditor/wireframe', 'Wireframe'),
            labelPlural: nls.localize('vuengine/actorEditor/wireframes', 'Wireframes'),
            hasContent: data.components?.wireframes?.length > 0,
        },
        {
            key: 'mutators',
            componentKey: 'mutators',
            labelSingular: nls.localize('vuengine/actorEditor/mutator', 'Mutator'),
            labelPlural: nls.localize('vuengine/actorEditor/mutators', 'Mutators'),
            hasContent: data.components?.mutators?.length > 0,
        },
        {
            key: 'children',
            componentKey: 'children',
            labelSingular: nls.localize('vuengine/actorEditor/child', 'Child'),
            labelPlural: nls.localize('vuengine/actorEditor/children', 'Children'),
            hasContent: data.components?.children?.length > 0,
        },
        {
            key: 'body',
            labelSingular: nls.localize('vuengine/actorEditor/body', 'Body'),
            labelPlural: nls.localize('vuengine/actorEditor/body', 'Body'),
            // labelPlural: nls.localize('vuengine/actorEditor/bodies', 'Bodies'),
            hasContent: data.body.enabled,
        },
        {
            key: 'extraProperties',
            labelSingular: nls.localize('vuengine/actorEditor/extraProperties', 'Extra Properties'),
            labelPlural: nls.localize('vuengine/actorEditor/extraProperties', 'Extra Properties'),
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
                            const actor = services.vesProjectService.getProjectDataItemById(c.itemId, 'Actor') as ActorData & WithFileUri;
                            if (actor) {
                                name = actor._fileUri.path.name;
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
                {nls.localize('vuengine/actorEditor/components', 'Components')}
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
