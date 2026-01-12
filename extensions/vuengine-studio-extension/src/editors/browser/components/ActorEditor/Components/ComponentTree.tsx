import { nls } from '@theia/core';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Tree } from 'react-arborist';
import { WithFileUri } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/Base/VContainer';
import { ActorEditorContext, ActorEditorContextType, AnimationData, ComponentKey, MutatorData, PositionedActorData, SoundComponentData } from '../ActorEditorTypes';
import ComponentTreeNode from './ComponentTreeNode';

interface ComponentType {
    key: ComponentKey
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
    const treeContainerRef = useRef<HTMLDivElement>(null);
    const [treeHeight, setTreeHeight] = useState<number>(300);
    const [treeWidth, setTreeWidth] = useState<number>(300);

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
            labelSingular: nls.localize('vuengine/editors/actor/sprite', 'Sprite'),
            labelPlural: nls.localize('vuengine/editors/actor/sprites', 'Sprites'),
            hasContent: data.components?.sprites?.length > 0,
        },
        {
            key: 'animations',
            componentKey: 'animations',
            labelSingular: nls.localize('vuengine/editors/actor/animation', 'Animation'),
            labelPlural: nls.localize('vuengine/editors/actor/animations', 'Animations'),
            hasContent: data.components?.animations?.length > 0,
        },
        {
            key: 'colliders',
            componentKey: 'colliders',
            labelSingular: nls.localize('vuengine/editors/actor/collider', 'Collider'),
            labelPlural: nls.localize('vuengine/editors/actor/colliders', 'Colliders'),
            hasContent: data.components?.colliders?.length > 0,
        },
        {
            key: 'wireframes',
            componentKey: 'wireframes',
            labelSingular: nls.localize('vuengine/editors/actor/wireframe', 'Wireframe'),
            labelPlural: nls.localize('vuengine/editors/actor/wireframes', 'Wireframes'),
            hasContent: data.components?.wireframes?.length > 0,
        },
        {
            key: 'mutators',
            componentKey: 'mutators',
            labelSingular: nls.localize('vuengine/editors/actor/mutator', 'Mutator'),
            labelPlural: nls.localize('vuengine/editors/actor/mutators', 'Mutators'),
            hasContent: data.components?.mutators?.length > 0,
        },
        {
            key: 'sounds',
            componentKey: 'sounds',
            labelSingular: nls.localize('vuengine/editors/actor/sound', 'Sound'),
            labelPlural: nls.localize('vuengine/editors/actor/sounds', 'Sounds'),
            hasContent: data.components?.sounds?.length > 0,
        },
        {
            key: 'children',
            componentKey: 'children',
            labelSingular: nls.localize('vuengine/editors/actor/child', 'Child'),
            labelPlural: nls.localize('vuengine/editors/actor/children', 'Children'),
            hasContent: data.components?.children?.length > 0,
        },
        {
            key: 'bodies',
            componentKey: 'bodies',
            labelSingular: nls.localize('vuengine/editors/actor/body', 'Body'),
            labelPlural: nls.localize('vuengine/editors/actor/bodies', 'Bodies'),
            hasContent: data.components?.bodies?.length > 0,
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
                        let itemName = (c as AnimationData).name;
                        switch (componentType.key) {
                            case 'children':
                            case 'sounds':
                                const itemId = (c as PositionedActorData | SoundComponentData).itemId;
                                const itemType = componentType.key === 'sounds' ? 'Sound' : 'Actor';
                                const item = services.vesProjectService.getProjectDataItemById(itemId, itemType) as WithFileUri;
                                if (item) {
                                    itemName = item._fileUri.path.name;
                                }
                                break;
                            case 'mutators':
                                itemName = (c as MutatorData).mutationClass;
                                break;
                        }
                        const fallbackName = `${componentType.labelSingular} ${i + 1}`;

                        newEntryChildren.push({
                            id: `${componentType.key}-${i}`,
                            name: itemName ?? fallbackName,
                        });
                    });
                    newEntry.children = newEntryChildren;
                }
                treeData.push(newEntry);
            }
        });

    treeData.push({
        id: 'addComponent',
        name: nls.localize('vuengine/editors/general/addComponent', 'Add Component'),
    });

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
        <VContainer
            style={{
                overflow: 'hidden',
                zIndex: 1,
            }}
        >
            <label style={{
                padding: '0 var(--padding)',
            }}>
                {nls.localize('vuengine/editors/actor/components', 'Components')}
            </label>
            <VContainer
                style={{
                    overflow: 'auto',
                    paddingBottom: 'var(--padding)',
                }}
            >
                <div
                    className='ves-tree'
                    ref={treeContainerRef}
                >
                    <Tree
                        data={treeData}
                        indent={20}
                        rowHeight={24}
                        openByDefault={true}
                        onMove={({ dragIds, parentId, index }) => moveComponent(dragIds, parentId!, index)}
                        selection={currentComponent.split('-', 2).join('-')} // ignore sub selections
                        height={treeHeight}
                        width={treeWidth}
                    >
                        {ComponentTreeNode}
                    </Tree>
                </div>
            </VContainer>
        </VContainer>
    );
}
