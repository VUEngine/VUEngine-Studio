import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/VContainer';
import { ActionConfigData, ActionData, ScriptedActionData } from './ScriptTypes';

interface CurrentScriptedActionProps {
    currentActionIndex: number
    currentAction: ActionData
    script: ScriptedActionData[]
    setScript: (script: ScriptedActionData[]) => void,
}

export default function CurrentScriptedAction(props: CurrentScriptedActionProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { currentActionIndex, currentAction, script, setScript } = props;

    const setConfigValue = (key: string, value: any): void => {
        const updatedScript = [...script];
        if (!updatedScript[currentActionIndex].config) {
            updatedScript[currentActionIndex].config = {};
        }
        updatedScript[currentActionIndex].config![key] = value;
        setScript(updatedScript);
    };

    const currentScriptedAction = script[currentActionIndex];

    const getConfigControl = (config: ActionConfigData): React.JSX.Element => {
        switch (config.type) {
            case 'boolean':
                // TODO
                return <></>;
            case 'type':
                const items = Object.values(services.vesProjectService.getProjectDataItemsForType(config.typeId || '') || {});
                // @ts-ignore
                const defaultValue = items.find(item => item.name === config.default)?._id || '';
                return <VContainer>
                    <label>{config.label}</label>
                    <SelectComponent
                        options={items
                            .sort((a, b) => {
                                // @ts-ignore
                                if (a.name > b.name) { return 1; }
                                // @ts-ignore
                                if (a.name < b.name) { return -1; }
                                return 0;
                            })
                            .map(f => ({
                                // @ts-ignore
                                value: f._id, label: f.name
                            }))}
                        defaultValue={currentScriptedAction.config ? currentScriptedAction.config[config.key] : defaultValue}
                        onChange={option => setConfigValue(config.key, option.value)}
                    />
                </VContainer>;
            default:
                return <VContainer>
                    <label>{config.label}</label>
                    <input
                        className='theia-input'
                        type={config.type}
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        value={currentScriptedAction.config ? currentScriptedAction.config[config.key] : config.default}
                        onChange={e => setConfigValue(config.key, e.target.value)}
                    />
                </VContainer>;
        }
    };

    return <VContainer className='item'>
        {script.length > 0 && currentActionIndex > -1 &&
            <>
                <div className='header'>
                    {currentAction.name}
                </div>
                {currentAction.config &&
                    <VContainer gap={10}>
                        {currentAction.config && currentAction.config.map((c, i) =>
                            <div key={'control-' + i}>
                                {getConfigControl(c)}
                            </div>
                        )}
                    </VContainer>
                }
                {!currentAction.config &&
                    <>This action needs no configuration.</>
                }
            </>
        }
        {script.length > 0 && currentActionIndex === -1 &&
            <>Select an action to edit.</>
        }
        {script.length === 0 &&
            <>Add a first action to this script by hovering over the function name and the end symbol.</>
        }
    </VContainer>;
}
