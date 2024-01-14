import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../../../editors/browser/ves-editors-types';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { ActionData, ScriptedActionData } from './ScriptTypes';

interface ScriptedActionProps {
    action: Partial<ActionData>
    scriptedAction?: ScriptedActionData
    addAction: () => void
    removeAction?: () => void
    isCurrentAction: boolean
    setCurrentAction: () => void
    isRoot?: boolean
    isEndNode?: boolean
}

export default function ScriptedAction(props: ScriptedActionProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { action, scriptedAction, addAction, removeAction, isCurrentAction, setCurrentAction, isRoot, isEndNode } = props;

    const meta: any[] = [];
    if (action.config) {
        action.config.map(c => {
            switch (c.type) {
                case 'text':
                    meta.push(scriptedAction?.config && scriptedAction?.config[c.key]
                        ? '"' + scriptedAction?.config[c.key] + '"'
                        : '"' + c.default + '"');
                    break;
                case 'type':
                    meta.push(scriptedAction?.config && scriptedAction?.config[c.key]
                        // @ts-ignore
                        ? services.vesProjectService.getProjectDataItemById(scriptedAction?.config[c.key], c.typeId || '')?.name || c.default
                        : c.default);
                    break;
                default:
                    meta.push(scriptedAction?.config && scriptedAction?.config[c.key]
                        ? scriptedAction?.config[c.key]
                        : c.default);
                    break;
            }
        });
    }

    return <VContainer className={`scripted-action-container ${isRoot ? 'root' : ''} ${isEndNode ? 'end' : ''}`}>
        <HContainer
            alignItems='start'
            className={`item scripted-action ${isCurrentAction ? 'active' : ''}`}
            onClick={setCurrentAction}
        >
            {removeAction && <button
                className="remove-button"
                onClick={removeAction}
                title={nls.localize('vuengine/entityEditor/removeAction', 'Remove Action')}
            >
                <i className='codicon codicon-x' />
            </button>}
            {action.iconClass &&
                <div>
                    <i className={action.iconClass} />
                </div>
            }
            {action?.name &&
                <VContainer gap={2} overflow='hidden'>
                    <div>{action.name}</div>
                    {!isRoot && !isEndNode &&
                        <div className='meta'>
                            {meta.join(', ')}
                        </div>
                    }
                </VContainer>
            }
        </HContainer>
        {!isEndNode && <button
            className='theia-button add-button full-width'
            onClick={addAction}
            title={nls.localize('vuengine/editors/addAction', 'Add Action')}
        >
            <i className='codicon codicon-plus' />
        </button>}
    </VContainer>;
}
