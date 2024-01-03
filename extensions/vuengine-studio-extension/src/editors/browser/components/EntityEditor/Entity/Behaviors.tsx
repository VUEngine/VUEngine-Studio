import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import SimpleListEditor from '../../SimpleListEditor/SimpleListEditor';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import { nls } from '@theia/core';

export default function Behaviors(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const setBehaviors = (behaviors: string[]): void => {
        setData({
            behaviors: {
                behaviors
            }
        });
    };

    return <VContainer>
        <label>
            {nls.localize('vuengine/entityEditor/behaviors', 'Behaviors')} {
                data.behaviors.behaviors.length > 0 && ` (${data.behaviors.behaviors.length})`
            }
        </label>
        <SimpleListEditor
            data={data.behaviors.behaviors}
            updateData={setBehaviors}
        />
    </VContainer>;
}
