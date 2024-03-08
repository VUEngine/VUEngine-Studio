import React, { useContext } from 'react';
import { Transparency, WireframeType } from '../../../Common/VUEngineTypes';
import { EntityEditorContext, EntityEditorContextType, WireframeData } from '../../EntityEditorTypes';
import AsteriskWireframe from './AsteriskWireframe';
import MeshWireframe from './MeshWireframe';
import SphereWireframe from './SphereWireframe';

export interface PreviewWireframeProps {
    index: number
    highlighted: boolean
    wireframe: WireframeData
}

export default function PreviewWireframe(props: PreviewWireframeProps): React.JSX.Element {
    const { setState } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index, highlighted, wireframe } = props;
    const style = {
        borderRadius: highlighted ? .5 : 0,
        display: 'flex',
        imageRendering: 'pixelated',
        opacity: wireframe.wireframe.transparency === Transparency.None ? 1 : .5,
        outline: highlighted ? '.5px solid rgba(0, 255, 0, .5)' : 'none',
        position: 'absolute',
        zIndex: highlighted ? 999999 : 120000,
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setState({ currentComponent: `wireframes-${index}` });
    };

    switch (wireframe.wireframe.type) {
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
