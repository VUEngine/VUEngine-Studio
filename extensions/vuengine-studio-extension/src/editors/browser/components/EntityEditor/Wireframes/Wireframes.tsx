import { nls } from '@theia/core';
import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType, Transparency, WireframeType } from '../EntityEditorTypes';
import Wireframe from './Wireframe';

export default function Wireframes(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const addWireframe = (): void => {
        const updatedWireframes = { ...data.wireframes };
        updatedWireframes.wireframes = [
            ...updatedWireframes.wireframes,
            {
                wireframe: {
                    type: WireframeType.Sphere,
                    displacement: {
                        x: 0,
                        y: 0,
                        z: 0,
                    },
                    color: 3,
                    transparency: Transparency.None,
                    interlaced: false,
                },
                segments: [],
                length: 0,
                radius: 0,
                drawCenter: true,
            },
        ];

        setData({ wireframes: updatedWireframes });
    };

    return <VContainer>
        <label>
            {nls.localize('vuengine/entityEditor/wireframes', 'Wireframes')} ({data.wireframes.wireframes.length})
        </label>
        {data.wireframes.wireframes.length > 0 && data.wireframes.wireframes.map((wireframe, index) =>
            <Wireframe
                key={`wireframe-${index}`}
                index={index}
                wireframe={wireframe}
            />
        )}
        <button
            className='theia-button add-button full-width'
            onClick={addWireframe}
            title={nls.localize('vuengine/entityEditor/addWireframe', 'Add Wireframe')}
        >
            <i className='codicon codicon-plus' />
        </button>
    </VContainer>;
}
