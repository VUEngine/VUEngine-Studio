import { QuickPickItem, QuickPickOptions, QuickPickSeparator, deepClone, nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { LogicEditorContext, LogicEditorContextType } from '../LogicEditorTypes';
import { AVAILABLE_ACTIONS, ActionConfigType, ActionData } from './AvailableActions';
import { ScriptedActionData } from './ScriptTypes';

interface ScriptedActionProps {
    id: string
    index: number
    script: ScriptedActionData[]
    action: Partial<ActionData>
    scriptedAction?: ScriptedActionData
    updateScript: (script: ScriptedActionData[]) => void
    isRoot?: boolean
    isEnd?: boolean
}

export default function ScriptedAction(props: ScriptedActionProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { currentComponent, setCurrentComponent } = useContext(LogicEditorContext) as LogicEditorContextType;
    const { id, index, script, action, scriptedAction, updateScript, isRoot, isEnd } = props;

    const setHighlightedAction = (actionIndex: number): void => {
        setCurrentComponent(id);
    };

    const showActionSelection = (): Promise<QuickPickItem | undefined> => {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: nls.localize('vuengine/editors/general/addAction', 'Add Action'),
            placeholder: nls.localize('vuengine/editors/general/selectActionToAdd', 'Select an action to add...'),
        };
        let previousCategory = '';
        const items: (QuickPickItem | QuickPickSeparator)[] = [];
        Object.values(AVAILABLE_ACTIONS)
            .sort((a, b) => {
                if (a.category > b.category) { return -1; }
                if (a.category < b.category) { return 1; }
                if (a.label > b.label) { return 1; }
                if (a.label < b.label) { return -1; }
                return 0;
            })
            .map(a => {
                if (previousCategory !== a.category) {
                    previousCategory = a.category;
                    items.push({
                        type: 'separator',
                        label: a.category,
                    });
                }
                items.push({
                    id: a.id,
                    label: a.label,
                    description: a.description,
                });
            });

        return services.quickPickService.show(
            items,
            quickPickOptions
        );
    };

    const addAction = async (): Promise<void> => {
        const actionToAdd = await showActionSelection();
        if (actionToAdd) {
            updateScript([
                ...script.slice(0, index + 1),
                {
                    id: actionToAdd.id!,
                },
                ...script.slice(index + 1)
            ]);

            setHighlightedAction(index + 1);
        }
    };

    const removeAction = async (): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/logic/removeAction', 'Remove Action'),
            msg: nls.localize('vuengine/editors/logic/areYouSureYouWantToRemoveAction', 'Are you sure you want to remove this action?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            updateScript([
                ...script.slice(0, index),
                ...script.slice(index + 1)
            ]);

            setHighlightedAction(-1);
        }
    };

    const updateBranchScript = (branchIndex: number, branchScript: ScriptedActionData[]) => {
        const updatedScript = deepClone(script);

        const updatedBranches = updatedScript[index].branches ?? [];
        updatedBranches[branchIndex] = {
            ...updatedBranches[branchIndex],
            script: branchScript,
        };

        updatedScript[index] = {
            ...updatedScript[index],
            branches: updatedBranches,
        };

        updateScript(updatedScript);
    };

    const onClick = (): void => {
        if (!isEnd && id !== '') {
            setHighlightedAction(index);
        }
    };

    const meta: any[] = [];
    if (action?.arguments) {
        action.arguments?.map(c => {
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
    if (isEnd) {
        containerClasses.push('end');
    }
    if (action?.branches?.length) {
        containerClasses.push('has-branches');
    }

    const actionClasses = ['scripted-action', 'item'];
    if (!isEnd && id === currentComponent) {
        actionClasses.push('active');
    }

    return <div className={containerClasses.join(' ')}>
        <HContainer
            alignItems='start'
            className={actionClasses.join(' ')}
            onClick={onClick}
        >
            {!isEnd && !isRoot &&
                <button
                    className="remove-button"
                    onClick={removeAction}
                    title={nls.localizeByDefault('Remove')}
                >
                    <i className='codicon codicon-x' />
                </button>
            }
            {action?.iconClass &&
                <i className={action.iconClass} />
            }
            {action?.label &&
                <VContainer gap={2} overflow='hidden'>
                    <div>{action.label}</div>
                    {!isRoot && !isEnd &&
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
                    <VContainer key={i} gap={0}>
                        <ScriptedAction
                            id=''
                            index={-2}
                            action={{
                                label: b.name,
                            }}
                            script={scriptedAction?.branches && scriptedAction?.branches[i] && scriptedAction?.branches[i].script
                                ? scriptedAction?.branches[i].script
                                : []}
                            updateScript={(s: ScriptedActionData[]) => updateBranchScript(i, s)}
                            isRoot
                        />
                        {scriptedAction?.branches && scriptedAction?.branches[i] && scriptedAction?.branches[i].script?.map((c, j) =>
                            <ScriptedAction
                                id={`${id}-${i}-${j}`}
                                index={j} // TODO
                                key={j}
                                script={scriptedAction?.branches && scriptedAction?.branches[i] && scriptedAction?.branches[i].script
                                    ? scriptedAction?.branches[i].script
                                    : []}
                                action={AVAILABLE_ACTIONS[c.id]}
                                updateScript={(s: ScriptedActionData[]) => updateBranchScript(i, s)}
                                scriptedAction={c}
                            />
                        )}
                        <ScriptedAction
                            id=''
                            index={-2}
                            script={[]}
                            action={{
                                iconClass: b.endNodeIconClass ? b.endNodeIconClass : 'codicon codicon-arrow-down',
                            }}
                            updateScript={() => { }}
                            isEnd
                        />
                    </VContainer>
                )}
            </div>
        }
        {
            !isEnd && <button
                className='theia-button add-button full-width'
                onClick={addAction}
                title={nls.localizeByDefault('Add')}
            >
                <i className='codicon codicon-plus' />
            </button>
        }
    </div>;
}
