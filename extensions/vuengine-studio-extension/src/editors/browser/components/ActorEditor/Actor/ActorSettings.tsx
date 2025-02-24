import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { ActorEditorContext, ActorEditorContextType } from '../ActorEditorTypes';

export default function ActorSettings(): React.JSX.Element {
    const { setCurrentComponent, currentComponent } = useContext(ActorEditorContext) as ActorEditorContextType;

    return (
        <div className='ves-tree'>
            <div
                role="treeitem"
                aria-selected={currentComponent === 'logic'}
                onClick={() => setCurrentComponent('logic')}
                tabIndex={-1}
            >
                <div className="ves-tree-node" style={{ paddingLeft: 0 }}>
                    <div className="ves-tree-node-icon">
                        <i className="codicon codicon-pulse"></i>
                    </div>
                    <div className="ves-tree-node-name">
                        {nls.localize('vuengine/editors/actor/logic', 'Logic')}
                    </div>
                </div>
            </div>
            <div
                role="treeitem"
                aria-selected={currentComponent === 'extraProperties'}
                onClick={() => setCurrentComponent('extraProperties')}
                tabIndex={-1}
            >
                <div className="ves-tree-node" style={{ paddingLeft: 0 }}>
                    <div className="ves-tree-node-icon">
                        <i className="codicon codicon-settings"></i>
                    </div>
                    <div className="ves-tree-node-name">
                        {nls.localize('vuengine/editors/actor/extraProperties', 'Extra Properties')}
                    </div>
                </div>
            </div>
        </div>
    );
}
