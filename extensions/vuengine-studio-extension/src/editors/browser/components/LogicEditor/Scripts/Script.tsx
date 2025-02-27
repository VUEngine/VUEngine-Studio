import React, { useContext } from 'react';
import { WHEEL_SENSITIVITY } from '../../ActorEditor/ActorEditorTypes';
import Scalable from '../../Common/Editor/Scalable';
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

    return (
        <Scalable
            minZoom={MIN_PREVIEW_SCRIPT_ZOOM}
            maxZoom={MAX_PREVIEW_SCRIPT_ZOOM}
            wheelSensitivity={WHEEL_SENSITIVITY}
            zoomStep={.5}
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
        </Scalable >
    );
}
