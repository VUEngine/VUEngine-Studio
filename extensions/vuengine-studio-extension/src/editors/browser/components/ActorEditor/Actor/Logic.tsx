import { nls } from '@theia/core';
import React, { useContext } from 'react';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import InfoLabel from '../../Common/InfoLabel';
import SimpleListEditor from '../../SimpleListEditor/SimpleListEditor';
import { ActorEditorContext, ActorEditorContextType, INPUT_BLOCKING_COMMANDS } from '../ActorEditorTypes';

export default function Logic(): React.JSX.Element {
    const { data, setData } = useContext(ActorEditorContext) as ActorEditorContextType;

    const setAllocator = (customAllocator: string): void => {
        setData({
            logic: {
                ...data.logic,
                customAllocator,
            }
        });
    };

    const setConfiguration = (configuration: Record<string, string>): void => {
        setData({
            logic: {
                ...data.logic,
                configuration,
            }
        });
    };

    return (
        <VContainer gap={15}>
            <Input
                label={nls.localize('vuengine/editors/actor/customAllocator', 'Custom Allocator')}
                tooltip={nls.localize(
                    'vuengine/editors/actor/customAllocatorDescription',
                    'Define which class to use to attach custom logic to this actor. If left blank, it will be Actor.',
                )}
                value={data.logic.customAllocator}
                setValue={setAllocator}
                commands={INPUT_BLOCKING_COMMANDS}
            />
            <VContainer grow={1}>
                <InfoLabel
                    label={nls.localize('vuengine/editors/actor/configurationValues', 'Configuration Values')}
                    tooltip={nls.localize(
                        'vuengine/editors/actor/configurationValuesDescription',
                        "The values of the custom allocator's additional spec properties."
                    )}
                />
                <SimpleListEditor
                    data={data.logic.configuration}
                    updateData={setConfiguration}
                    sort={false}
                />
            </VContainer>
        </VContainer>
    );
}
