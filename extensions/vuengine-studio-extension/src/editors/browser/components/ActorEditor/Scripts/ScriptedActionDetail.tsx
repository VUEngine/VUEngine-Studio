import { nls } from '@theia/core';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import RadioSelect from '../../Common/Base/RadioSelect';
import VContainer from '../../Common/Base/VContainer';
import { ActorEditorContext, ActorEditorContextType, ScriptData } from '../ActorEditorTypes';
import { ScriptType } from './ScriptTypes';
import { AVAILABLE_ACTIONS, ActionArgumentsData, ActionConfigType } from './AvailableActions';
import { ACTOR_FUNCTIONS } from './ActorFunctions';
import { INPUT_BLOCKING_COMMANDS } from '../ActorEditor';
import InfoLabel from '../../Common/InfoLabel';

export default function ScriptedActionDetail(): React.JSX.Element {
    const { data, setData, currentComponent } = useContext(ActorEditorContext) as ActorEditorContextType;
    const { services, enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;

    const currentComponentParts = currentComponent.split('-');
    const currentScriptIndex = currentComponentParts[1] ? parseInt(currentComponentParts[1]) : 0;
    const currentActionIndex = currentComponentParts[2] ? parseInt(currentComponentParts[2]) : -1;
    const scriptConfig = data.components.scripts[currentScriptIndex];
    const script = scriptConfig?.script ?? [];
    let currentScriptedAction = script[currentActionIndex];
    // follow branches
    let x = 3;
    while (currentComponentParts[x] && currentComponentParts[x + 1] &&
        currentScriptedAction.branches && currentScriptedAction.branches[parseInt(currentComponentParts[x])] &&
        currentScriptedAction.branches[parseInt(currentComponentParts[x])].script &&
        currentScriptedAction.branches[parseInt(currentComponentParts[x])].script[parseInt(currentComponentParts[x + 1])]) {
        currentScriptedAction = currentScriptedAction.branches[parseInt(currentComponentParts[x])].script[parseInt(currentComponentParts[x + 1])];
        x += 2;
    }
    const currentAction = AVAILABLE_ACTIONS[currentScriptedAction?.id ?? 0];

    const updateScript = (partialScriptData: Partial<ScriptData>): void => {
        const updatedScripts = [...data.components.scripts || []];
        updatedScripts[currentScriptIndex] = {
            ...updatedScripts[currentScriptIndex],
            ...partialScriptData,
        };

        setData({
            components: {
                ...data.components,
                scripts: updatedScripts,
            }
        });
    };

    const setName = (name: string): void => {
        updateScript({ name });
    };
    const setType = (type: ScriptType): void => {
        updateScript({ type });
    };

    const setConfigValue = (key: string, value: any): void => {
        const updatedScript = [
            ...scriptConfig.script,
        ];
        updatedScript[currentActionIndex] = {
            ...updatedScript[currentActionIndex],
            config: {
                ...updatedScript[currentActionIndex].config,
                [key]: value,
            },
        };

        updateScript({ script: updatedScript });
    };

    const getConfigControl = (config: ActionArgumentsData): React.JSX.Element => {
        switch (config.type) {
            case ActionConfigType.Boolean:
                // TODO
                return <></>;
            case ActionConfigType.Type:
                const items = Object.values(services.vesProjectService.getProjectDataItemsForType(config.typeId || '') || {});
                // @ts-ignore
                const defaultValue = items.find(item => item.name === config.default)?._id || '';
                return <select
                    className='theia-select'
                    onChange={e => setConfigValue(config.key, e.target.value)}
                    value={currentScriptedAction.config && currentScriptedAction.config[config.key]
                        ? currentScriptedAction.config[config.key]
                        : defaultValue}
                >
                    {items
                        .sort((a, b) => {
                            // @ts-ignore
                            if (a.name > b.name) { return 1; }
                            // @ts-ignore
                            if (a.name < b.name) { return -1; }
                            return 0;
                        })
                        .map((f, i) =>
                            // @ts-ignore
                            <option key={i} value={f._id}>{f.name}</option>
                        )}
                </select>;
            case ActionConfigType.TextArea:
                return <ReactTextareaAutosize
                    className="theia-input"
                    value={currentScriptedAction.config && currentScriptedAction.config[config.key]
                        ? currentScriptedAction.config[config.key]
                        : config.default}
                    maxRows={8}
                    onChange={e => setConfigValue(config.key, e.target.value)}
                    style={{ resize: 'none' }}
                />;
            default:
                return <input
                    className='theia-input'
                    type={config.type}
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={currentScriptedAction.config && currentScriptedAction.config[config.key]
                        ? currentScriptedAction.config[config.key]
                        : config.default}
                    onChange={e => setConfigValue(config.key, e.target.value)}
                />;
        }
    };

    return <VContainer gap={15}>
        {currentActionIndex === -1 &&
            <>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/type', 'Type')}
                    </label>
                    <RadioSelect
                        options={[
                            { value: ScriptType.Custom, label: nls.localize('vuengine/actorEditor/scriptTypeCustom', 'Custom') },
                            { value: ScriptType.Inherited, label: nls.localize('vuengine/actorEditor/scriptTypeInherited', 'Inherited') },
                        ]}
                        canSelectMany={false}
                        allowBlank={false}
                        defaultValue={scriptConfig.type}
                        onChange={options => setType(options[0].value as ScriptType)}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </VContainer>
                {scriptConfig.type === ScriptType.Custom &&
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/editors/name', 'Name')}
                        </label>
                        <input
                            className='theia-input'
                            type='string'
                            value={scriptConfig.name}
                            onChange={e => setName(e.target.value)}
                        />
                    </VContainer>
                }
                {scriptConfig.type === ScriptType.Inherited &&
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/actorEditor/inheritedFunction', 'Inherited Function')}
                        </label>
                        <SelectComponent
                            options={Object.values(ACTOR_FUNCTIONS)
                                .sort((a, b) => a.label.localeCompare(b.label))
                                .map(f => ({
                                    value: f.name,
                                    label: f.label,
                                    description: f.description,
                                }))}
                            defaultValue={scriptConfig.name}
                            onChange={option => setName(option.value!)}
                        />
                    </VContainer>
                }
            </>
        }
        <VContainer>
            <label>{currentAction?.label}</label>
            <div className='secondaryText'>
                {currentAction?.description}
            </div>
        </VContainer>
        {currentActionIndex > -1 &&
            <>
                {currentAction?.arguments && currentAction.arguments.map((c, i) =>
                    <VContainer key={i}>
                        <InfoLabel
                            label={c.label}
                            tooltip={c.description}
                        />
                        {getConfigControl(c)}
                    </VContainer>
                )}
                {!currentAction?.arguments &&
                    nls.localize('vuengine/actorEditor/noActionConfiguration', 'This action does not need any configuration.')
                }
            </>
        }
    </VContainer>;
}
