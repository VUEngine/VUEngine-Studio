import { QuickPickItem, QuickPickOptions, QuickPickSeparator, nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import CurrentScriptedAction from './CurrentScriptedAction';
import { ActionMap, ScriptedActionData } from './ScriptTypes';
import ScriptedAction from './ScriptedAction';

const actions: ActionMap = {
    'Printing::text': {
        id: 'Printing::text',
        name: 'Print Text',
        category: 'Printing',
        iconClass: 'fa fa-font',
        template: 'templates/action/Printing_text',
        config: [{
            key: 'text',
            label: 'Text',
            type: 'text',
            default: '',
        }, {
            key: 'positionX',
            label: 'X Position',
            type: 'number',
            default: 0,
            min: 0,
            max: 63,
        }, {
            key: 'positionY',
            label: 'Y Position',
            type: 'number',
            default: 0,
            min: 0,
            max: 47,
        }, {
            key: 'font',
            label: 'Font',
            type: 'type',
            typeId: 'Font',
            default: 'Default',
        }]
    },
    'Printing::int32': {
        id: 'Printing::int32',
        name: 'Print Number',
        category: 'Printing',
        iconClass: 'fa fa-font',
        template: 'templates/action/Printing_int32',
    },
    'Printing::clear': {
        id: 'Printing::clear',
        name: 'Clear Printing Layer',
        category: 'Printing',
        iconClass: 'fa fa-font',
        template: 'templates/action/Printing_clear',
    },
    'addEventListener': {
        id: 'addEventListener',
        name: 'Add Event Listener',
        category: 'Messaging',
        iconClass: 'fa fa-commenting-o',
        template: 'templates/action/ListenerObject_addEventListener',
    },
    'removeEventListener': {
        id: 'removeEventListener',
        name: 'Remove Event Listener',
        category: 'Messaging',
        iconClass: 'fa fa-commenting-o',
        template: 'templates/action/ListenerObject_removeEventListener',
    },
    'fireEvent': {
        id: 'fireEvent',
        name: 'Fire Event',
        category: 'Messaging',
        iconClass: 'fa fa-commenting-o',
        template: 'templates/action/ListenerObject_fireEvent',
        config: [{
            key: 'event',
            label: 'Event',
            type: 'type',
            typeId: 'Event',
            default: 'ContainerDeleted',
        }]
    },
};

interface ScriptsProps {
}

export default function Scripts(props: ScriptsProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const [script, setScript] = useState<ScriptedActionData[]>([]);
    const [currentActionIndex, setCurrentActionIndex] = useState<number>(-1);

    const showActionSelection = async (): Promise<QuickPickItem | undefined> => {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: nls.localize('vuengine/editors/addAction', 'Add Action'),
            placeholder: nls.localize('vuengine/editors/selectActionToAdd', 'Select an action to add...'),
        };
        let previopusCategory = '';
        const items: (QuickPickItem | QuickPickSeparator)[] = [];
        Object.values(actions)
            .sort((a, b) => {
                if (a.category > b.category) { return -1; }
                if (a.category < b.category) { return 1; }
                if (a.name > b.name) { return 1; }
                if (a.name < b.name) { return -1; }
                return 0;
            })
            .map(action => {
                if (previopusCategory !== action.category) {
                    previopusCategory = action.category;
                    items.push({
                        type: 'separator',
                        label: action.category,
                    });
                }
                items.push({
                    id: action.id,
                    label: action.name,
                });
            });

        return services.quickPickService.show(
            items,
            quickPickOptions
        );
    };

    const addAction = async (index: number): Promise<void> => {
        const actionToAdd = await showActionSelection();
        if (actionToAdd) {
            setScript([
                ...script.slice(0, index),
                {
                    id: actionToAdd.id!,
                },
                ...script.slice(index)
            ]);
            setCurrentActionIndex(index);
        }
    };

    const removeAction = async (index: number): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/entityEditor/removeAction', 'Remove Action'),
            msg: nls.localize('vuengine/entityEditor/areYouSureYouWantToRemoveAction', 'Are you sure you want to remove this action?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            setScript([
                ...script.slice(0, index),
                ...script.slice(index + 1)
            ]);
            setCurrentActionIndex(-1);
        }
    };

    const currentScriptedAction = script[currentActionIndex];
    const currentAction = actions[currentScriptedAction?.id || 0];

    return <HContainer overflow='hidden' grow={1}>
        <VContainer alignItems='center' gap={0} grow={1} overflow='auto'>
            <ScriptedAction
                action={{
                    name: 'Enitity Ready',
                }}
                addAction={() => addAction(0)}
                isCurrentAction={false}
                setCurrentAction={() => { }}
                isRoot
            />
            {script.map((s, i) =>
                <ScriptedAction
                    action={actions[s.id]}
                    scriptedAction={script[i]}
                    addAction={() => addAction(i + 1)}
                    removeAction={() => removeAction(i)}
                    isCurrentAction={currentActionIndex === i}
                    setCurrentAction={() => setCurrentActionIndex(i)}
                />
            )}
            <ScriptedAction
                action={{
                    iconClass: 'fa fa-stop',
                }}
                addAction={() => addAction(0)}
                isCurrentAction={false}
                setCurrentAction={() => { }}
                isEndNode
            />
        </VContainer>
        <VContainer overflow='auto' style={{ width: 250 }}>
            <CurrentScriptedAction
                currentActionIndex={currentActionIndex}
                currentAction={currentAction}
                script={script}
                setScript={setScript}
            />
        </VContainer>
    </HContainer>;
}
