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

    return <VContainer gap={10}>
        {data.wireframes.wireframes.length
            ? data.wireframes.wireframes.map((m, i) =>
                <Wireframe
                    key={`wireframe-${i}`}
                    index={i}
                    wireframe={m}
                />
            )
            : <>{nls.localize('vuengine/entityEditor/noWireframes', 'No Wireframes')}</>
        }
        <button
            className='theia-button secondary full-width'
            onClick={addWireframe}
            title={nls.localize('vuengine/entityEditor/addireframe', 'Add ireframe')}
        >
            <i className='fa fa-plus' />
        </button>
    </VContainer>;
}
