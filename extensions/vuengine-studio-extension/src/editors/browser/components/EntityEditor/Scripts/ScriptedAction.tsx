import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../../../editors/browser/ves-editors-types';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { AVAILABLE_ACTIONS, ActionConfigType, ActionData, ScriptedActionData } from './ScriptTypes';

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
    if (action?.config) {
        action.config.map(c => {
            switch (c.type) {
                case ActionConfigType.Text:
                case ActionConfigType.TextArea:
                    meta.push(scriptedAction?.config && scriptedAction?.config[c.key]
                        ? '"' + scriptedAction?.config[c.key] + '"'
                        : '"' + c.default + '"');
                    break;
                case ActionConfigType.Type:
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

    const containerClasses = ['scripted-action-container'];
    if (isRoot) {
        containerClasses.push('root');
    }
    if (isEndNode) {
        containerClasses.push('end');
    }
    if (action?.branches?.length) {
        containerClasses.push('has-branches');
    }

    const actionClasses = ['scripted-action', 'item'];
    if (isCurrentAction) {
        actionClasses.push('active');
    }

    return <div className={containerClasses.join(' ')}>
        <HContainer
            alignItems='start'
            className={actionClasses.join(' ')}
            onClick={setCurrentAction}
        >
            {removeAction && <button
                className="remove-button"
                onClick={removeAction}
                title={nls.localize('vuengine/entityEditor/removeAction', 'Remove Action')}
            >
                <i className='codicon codicon-x' />
            </button>}
            {action?.iconClass &&
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
        {action?.branches &&
            <div className='scripted-action-branches'>
                {action.branches?.map((b, i) =>
                    <VContainer key={i}>
                        <ScriptedAction
                            action={{
                                name: b.name,
                            }}
                            addAction={() => addAction()}
                            isCurrentAction={false}
                            setCurrentAction={() => { }}
                            isRoot
                        />
                        {scriptedAction?.branches && scriptedAction?.branches[i].script.map((c, j) =>
                            <ScriptedAction
                                key={j}
                                action={AVAILABLE_ACTIONS[c.id]}
                                scriptedAction={c}
                                addAction={() => addAction()}
                                removeAction={() => removeAction!()}
                                isCurrentAction={false}
                                setCurrentAction={() => { }}
                            />
                        )}
                    </VContainer>
                )}
            </div>
        }
        {
            !isEndNode && <button
                className='theia-button add-button full-width'
                onClick={addAction}
                title={nls.localize('vuengine/editors/addAction', 'Add Action')}
            >
                <i className='codicon codicon-plus' />
            </button>
        }
    </div>;
}
