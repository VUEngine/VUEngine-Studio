import React, { useContext } from 'react';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import Sprite from './Sprite';

interface SpritesListProps {
}

export default function SpritesList(props: SpritesListProps): React.JSX.Element {
    const { data } = useContext(EntityEditorContext) as EntityEditorContextType;

    return <>
        {data.sprites.sprites.length > 0 &&
            <VContainer>
                {data.sprites.sprites.map((s, i) =>
                    <Sprite
                        key={`sprite-${i}`}
                        index={i}
                        sprite={s}
                    />
                )}
            </VContainer>
        }
    </>;
}
