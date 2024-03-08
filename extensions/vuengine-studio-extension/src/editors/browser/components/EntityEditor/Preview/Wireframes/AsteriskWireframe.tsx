import React from 'react';
import { WireframeData } from '../../EntityEditorTypes';
import MeshWireframe from './MeshWireframe';

export interface AsteriskWireframeProps {
    wireframe: WireframeData
    style: Object
    onClick: (e: React.MouseEvent) => void
}

export default function AsteriskWireframe(props: AsteriskWireframeProps): React.JSX.Element {
    const { wireframe, style, onClick } = props;
    const halfLength = wireframe.length / 2;

    return <MeshWireframe
        style={style}
        onClick={onClick}
        wireframe={{
            ...wireframe,
            segments: [{
                fromVertex: {
                    x: -halfLength,
                    y: -halfLength,
                    z: 0,
                    parallax: 0,
                },
                toVertex: {
                    x: halfLength,
                    y: halfLength,
                    z: 0,
                    parallax: 0,
                },
            }, {
                fromVertex: {
                    x: halfLength,
                    y: -halfLength,
                    z: 0,
                    parallax: 0,
                },
                toVertex: {
                    x: -halfLength,
                    y: halfLength,
                    z: 0,
                    parallax: 0,
                },
            }, {
                fromVertex: {
                    x: 0,
                    y: -halfLength,
                    z: 0,
                    parallax: 0,
                },
                toVertex: {
                    x: 0,
                    y: halfLength,
                    z: 0,
                    parallax: 0,
                },
            }, {
                fromVertex: {
                    x: -halfLength,
                    y: 0,
                    z: 0,
                    parallax: 0,
                },
                toVertex: {
                    x: halfLength,
                    y: 0,
                    z: 0,
                    parallax: 0,
                },
            }],
        }}
    />;
}
