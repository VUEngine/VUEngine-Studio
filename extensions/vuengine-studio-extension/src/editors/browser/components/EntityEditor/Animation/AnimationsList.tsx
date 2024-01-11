import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import Animation from './Animation';

export default function AnimationsList(): React.JSX.Element {
    const { data } = useContext(EntityEditorContext) as EntityEditorContextType;

    return <>
        {data.animations.animations.length > 0 &&
            <VContainer>
                {data.animations.animations.map((animation, index) =>
                    <Animation
                        key={`animation-${index}`}
                        index={index}
                        animation={animation}
                        totalFrames={data.animations.totalFrames}
                    />
                )}
            </VContainer>
        }
    </>;
}
