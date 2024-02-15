import { QuickPickItem, QuickPickOptions, QuickPickSeparator, nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { EntityEditorContext, EntityEditorContextType, MAX_PREVIEW_SCRIPT_ZOOM, MIN_PREVIEW_SCRIPT_ZOOM, WHEEL_SENSITIVITY } from '../EntityEditorTypes';
import { AVAILABLE_ACTIONS } from './ScriptTypes';
import ScriptedAction from './ScriptedAction';
import PreviewOptions from '../Preview/PreviewOptions';

interface ScriptProps {
    index: number
}

export default function Script(props: ScriptProps): React.JSX.Element {
    const { index } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, setData, state, setState } = useContext(EntityEditorContext) as EntityEditorContextType;
    const [zoom, setZoom] = useState<number>(1);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [offsetX, setOffsetX] = useState<number>(0);
    const [offsetY, setOffsetY] = useState<number>(0);

    const scriptConfig = data.components.scripts[index];
    const script = scriptConfig.script ?? [];

    const showActionSelection = async (): Promise<QuickPickItem | undefined> => {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: nls.localize('vuengine/editors/addAction', 'Add Action'),
            placeholder: nls.localize('vuengine/editors/selectActionToAdd', 'Select an action to add...'),
        };
        let previopusCategory = '';
        const items: (QuickPickItem | QuickPickSeparator)[] = [];
        Object.values(AVAILABLE_ACTIONS)
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

    const addAction = async (i: number): Promise<void> => {
        const actionToAdd = await showActionSelection();
        if (actionToAdd) {
            const updatedScripts = [...data.components.scripts || []];
            updatedScripts[index] = {
                ...updatedScripts[index],
                script: [
                    ...script.slice(0, i),
                    {
                        id: actionToAdd.id!,
                    },
                    ...script.slice(i)
                ]
            };

            setData({
                components: {
                    ...data.components,
                    scripts: updatedScripts,
                }
            });

            setHighlightedAction(index);
        }
    };

    const removeAction = async (i: number): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/entityEditor/removeAction', 'Remove Action'),
            msg: nls.localize('vuengine/entityEditor/areYouSureYouWantToRemoveAction', 'Are you sure you want to remove this action?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const updatedScripts = [...data.components.scripts || []];
            updatedScripts[index] = {
                ...updatedScripts[index],
                script: [
                    ...script.slice(0, i),
                    ...script.slice(i + 1)
                ]
            };

            setData({
                components: {
                    ...data.components,
                    scripts: updatedScripts,
                }
            });

            setHighlightedAction(-1);
        }
    };

    const setHighlightedAction = async (actionIndex: number): Promise<void> => {
        setState({ currentComponent: `scripts-${index}-${actionIndex}` });
    };

    const onWheel = (e: React.WheelEvent): void => {
        if (e.ctrlKey) {
            let z = zoom - e.deltaY / WHEEL_SENSITIVITY;

            if (z > MAX_PREVIEW_SCRIPT_ZOOM) {
                z = MAX_PREVIEW_SCRIPT_ZOOM;
            } else if (z < MIN_PREVIEW_SCRIPT_ZOOM) {
                z = MIN_PREVIEW_SCRIPT_ZOOM;
            }

            setZoom(z);
        }
    };

    const onMouseMove = (e: React.MouseEvent): void => {
        if (isDragging) {
            setOffsetX(offsetX + e.movementX);
            setOffsetY(offsetY + e.movementY);
        }
    };

    const center = (): void => {
        setOffsetX(0);
        setOffsetY(0);
    };

    const currentComponentParts = state.currentComponent.split('-');
    const currentActionIndex = currentComponentParts[2] ? parseInt(currentComponentParts[2]) : -1;

    return (
        <div
            className={`script-container${isDragging ? ' dragging' : ''}`}
            onWheel={onWheel}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={onMouseMove}
        >
            <PreviewOptions
                enableBackground={false}
                zoom={zoom}
                setZoom={setZoom}
                minZoom={MIN_PREVIEW_SCRIPT_ZOOM}
                maxZoom={MAX_PREVIEW_SCRIPT_ZOOM}
                zoomStep={0.1}
                center={center}
            />
            <div
                className='script-inner-container'
                style={{
                    transform: `scale(${zoom})`,
                    translate: `${offsetX}px ${offsetY}px`,
                }}
            >
                <ScriptedAction
                    action={{
                        name: scriptConfig.name,
                    }}
                    addAction={() => addAction(0)}
                    isCurrentAction={currentActionIndex === -1}
                    setCurrentAction={() => setHighlightedAction(-1)}
                    isRoot
                />
                {script.map((s, i) =>
                    <ScriptedAction
                        key={i}
                        action={AVAILABLE_ACTIONS[s.id]}
                        scriptedAction={script[i]}
                        addAction={() => addAction(i + 1)}
                        removeAction={() => removeAction(i)}
                        isCurrentAction={currentActionIndex === i}
                        setCurrentAction={() => setHighlightedAction(i)}
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
            </div>
        </div>
    );
}
