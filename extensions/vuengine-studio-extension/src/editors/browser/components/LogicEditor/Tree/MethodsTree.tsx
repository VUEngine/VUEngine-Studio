import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { Tree } from 'react-arborist';
import VContainer from '../../Common/Base/VContainer';
import { LogicEditorContext, LogicEditorContextType } from '../LogicEditorTypes';
import MethodTreeNode from './MethodTreeNode';

interface TreeNode {
    id: string
    name: string
    children?: TreeNode[]
}

export default function MethodsTree(): React.JSX.Element {
    const { currentComponent } = useContext(LogicEditorContext) as LogicEditorContextType;
    const { data, updateData } = useContext(LogicEditorContext) as LogicEditorContextType;

    const moveMethod = (
        dragIds: string[],
        parentId: string,
        targetIndex: number,
    ): void => {
        const [type, indexString] = dragIds[0].split('-');
        const currentIndex = parseInt(indexString || '-1');

        if (type === parentId) {
            // @ts-ignore
            const updatedMethods = [...data.methods];
            updatedMethods.splice(targetIndex > currentIndex
                ? targetIndex - 1
                : targetIndex, 0,
            );
            updateData({
                ...data,
                methods: updatedMethods,
            });
        }
    };

    const treeData: TreeNode[] = [];
    data.methods.map((c, i) => {
        treeData.push({
            id: `method-${i}`,
            name: c.name ?? `Method ${i + 1}`,
        });
    });

    treeData.push({
        id: 'addMethod',
        name: nls.localize('vuengine/editors/logic/addMethod', 'Add Method'),
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
                {nls.localize('vuengine/editors/logic/methods', 'Methods')}
            </label>
            <div className='ves-tree' style={{
                overflow: 'auto',
                paddingBottom: 'var(--padding)',
            }}>
                <Tree
                    data={treeData}
                    indent={20}
                    rowHeight={24}
                    openByDefault={true}
                    width='100%'
                    onMove={({ dragIds, parentId, index }) => moveMethod(dragIds, parentId!, index)}
                    selection={currentComponent.split('-', 2).join('-')} // ignore sub selections
                >
                    {MethodTreeNode}
                </Tree>
            </div>
        </VContainer>
    );
}
