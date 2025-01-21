import React, { useContext } from 'react';
import { Transparency, WireframeType } from '../../../Common/VUEngineTypes';
import { ActorEditorContext, ActorEditorContextType, WireframeData } from '../../ActorEditorTypes';
import AsteriskWireframe from './AsteriskWireframe';
import MeshWireframe from './MeshWireframe';
import SphereWireframe from './SphereWireframe';

export interface PreviewWireframeProps {
    index: number
    highlighted: boolean
    wireframe: WireframeData
}

export default function PreviewWireframe(props: PreviewWireframeProps): React.JSX.Element {
    const { setCurrentComponent } = useContext(ActorEditorContext) as ActorEditorContextType;
    const { index, highlighted, wireframe } = props;
    const style = {
        borderRadius: highlighted ? .25 : 0,
        cursor: 'pointer',
        display: 'flex',
        imageRendering: 'pixelated',
        opacity: wireframe.transparency === Transparency.None ? 1 : .5,
        outline: highlighted ? '1px solid #0f0' : 'none',
        outlineOffset: 1,
        position: 'absolute',
        zIndex: highlighted ? 999999 : 110000,
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentComponent(`wireframes-${index}`);
    };

    switch (wireframe.type) {
        case WireframeType.Mesh:
            return <MeshWireframe
                wireframe={wireframe}
                style={style}
                onClick={handleClick}
            />;
        case WireframeType.Asterisk:
            return <AsteriskWireframe
                wireframe={wireframe}
                style={style}
                onClick={handleClick}
            />;
        case WireframeType.Sphere:
            return <SphereWireframe
                wireframe={wireframe}
                style={style}
                onClick={handleClick}
            />;
    };
}
