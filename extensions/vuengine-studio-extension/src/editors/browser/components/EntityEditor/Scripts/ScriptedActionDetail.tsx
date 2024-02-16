import { nls } from '@theia/core';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import RadioSelect from '../../Common/RadioSelect';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType, ScriptData } from '../EntityEditorTypes';
import { AVAILABLE_ACTIONS, ActionConfigData, ActionConfigType, ScriptType } from './ScriptTypes';

export default function ScriptedActionDetail(): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, setData, state } = useContext(EntityEditorContext) as EntityEditorContextType;

    const currentComponentParts = state.currentComponent.split('-');
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

    const getConfigControl = (config: ActionConfigData): React.JSX.Element => {
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
                            { value: ScriptType.Custom, label: nls.localize('vuengine/entityEditor/scriptTypeCustom', 'Custom') },
                            { value: ScriptType.Inherited, label: nls.localize('vuengine/entityEditor/scriptTypeInherited', 'Inherited') },
                        ]}
                        canSelectMany={false}
                        allowBlank={false}
                        defaultValue={scriptConfig.type}
                        onChange={options => setType(options[0].value as ScriptType)}
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
                            {nls.localize('vuengine/entityEditor/inheritedFunction', 'Inherited Function')}
                        </label>
                        <SelectComponent
                            options={[{
                                value: 'Entity Created',
                                description: 'This function is being called right after the entity had been created.'
                            }, {
                                value: 'Resume',
                                description: 'This function is being called when the game resumes after exiting a special state, e.g. pause screen.'
                            }]}
                            defaultValue={scriptConfig.name}
                            onChange={option => setName(option.value!)}
                        />
                    </VContainer>
                }
            </>
        }
        {currentActionIndex > -1 &&
            <>
                {currentAction?.config &&
                    <>
                        {currentAction.config && currentAction.config.map((c, i) =>
                            <div key={i}>
                                <VContainer>
                                    <label>{c.label}</label>
                                    {getConfigControl(c)}
                                </VContainer>
                            </div>
                        )}
                    </>
                }
                {!currentAction?.config &&
                    nls.localize('vuengine/entityEditor/noActionConfiguration', 'This action does not need any configuration.')
                }
            </>
        }
    </VContainer>;
}
