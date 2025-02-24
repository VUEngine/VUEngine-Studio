import React, { useContext, useState } from 'react';
import { WHEEL_SENSITIVITY } from '../../ActorEditor/ActorEditorTypes';
import VContainer from '../../Common/Base/VContainer';
import { LogicEditorContext, LogicEditorContextType, MAX_PREVIEW_SCRIPT_ZOOM, MIN_PREVIEW_SCRIPT_ZOOM } from '../LogicEditorTypes';
import { AVAILABLE_ACTIONS } from './AvailableActions';
import { ScriptedActionData } from './ScriptTypes';
import ScriptedAction from './ScriptedAction';

interface ScriptProps {
    index: number
}

export default function Script(props: ScriptProps): React.JSX.Element {
    const { index } = props;
    const { data, updateData, currentComponent } = useContext(LogicEditorContext) as LogicEditorContextType;
    const [zoom, setZoom] = useState<number>(1);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [offsetX, setOffsetX] = useState<number>(0);
    const [offsetY, setOffsetY] = useState<number>(0);

    const currentComponentParts = currentComponent.split('-');
    const currentScriptIndex = currentComponentParts[1] ? parseInt(currentComponentParts[1]) : 0;

    const scriptConfig = data.methods[currentScriptIndex];
    const script = scriptConfig?.script ?? [];

    const updateScript = (s: ScriptedActionData[]) => {
        const updatedMethods = [...data.methods || []];
        updatedMethods[currentScriptIndex] = {
            ...updatedMethods[currentScriptIndex],
            ...{ script: s },
        };

        updateData({
            ...data,
            methods: updatedMethods
        });
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

    /*
    const center = (): void => {
        setOffsetX(0);
        setOffsetY(0);
    };
    */

    return (
        <VContainer
            grow={1}
            overflow='hidden'
            style={{
                inset: 0,
                position: 'absolute',
            }}>
            <div
                className={`script-container${isDragging ? ' dragging' : ''}`}
                onWheel={onWheel}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={onMouseMove}
            >
                <div
                    className='script-inner-container'
                    style={{
                        transform: `scale(${zoom})`,
                        translate: `${offsetX}px ${offsetY}px`,
                    }}
                >
                    <ScriptedAction
                        id={`scripts-${index}`}
                        action={{
                            label: scriptConfig?.name,
                        }}
                        script={script}
                        index={-1}
                        updateScript={updateScript}
                        isRoot
                    />
                    {script.map((s, i) =>
                        <ScriptedAction
                            id={`scripts-${index}-${i}`}
                            key={i}
                            script={script}
                            index={i}
                            action={AVAILABLE_ACTIONS[s.id]}
                            scriptedAction={script[i]}
                            updateScript={updateScript}
                        />
                    )}
                    <ScriptedAction
                        id=''
                        action={{
                            iconClass: 'fa fa-stop',
                        }}
                        script={script}
                        index={-2}
                        updateScript={() => { }}
                        isEnd
                    />
                </div>
            </div>
        </VContainer>
    );
}
