import React, { useContext, useEffect, useRef } from 'react';
import { ColorMode, PALETTE_COLORS } from '../../../../../../core/browser/ves-common-types';
import { EntityEditorContext, EntityEditorContextType, WIREFRAME_CANVAS_PADDING, WireframeData } from '../../EntityEditorTypes';
import { Transparency } from '../../../Common/VUEngineTypes';

export interface MeshWireframeProps {
    index: number
    highlighted: boolean
    wireframe: WireframeData
}

// bresenham line algorithm
const plotLine = (context: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, interlaced: boolean): void => {
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let e2;
    let lastPixelPlotted = false;

    for (; ;) {
        if (!interlaced || !lastPixelPlotted) {
            context.fillRect(x0, y0, 1, 1);
        }
        lastPixelPlotted = !lastPixelPlotted;

        if (x0 === x1 && y0 === y1) {
            break;
        };

        e2 = err << 1;

        if (e2 >= dy) {
            err += dy;
            x0 += sx;
        }
        if (e2 <= dx) {
            err += dx;
            y0 += sy;
        }
    }
};

export default function MeshWireframe(props: MeshWireframeProps): React.JSX.Element {
    const { setState } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index, highlighted, wireframe } = props;
    // eslint-disable-next-line no-null/no-null
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const draw = (projectedSegments: number[][], minX: number, minY: number, maxX: number, maxY: number): void => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        const width = Math.abs(maxX - minX) || 1;
        const height = Math.abs(maxY - minY) || 1;
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        const offsetX = (maxX + minX) / 2;
        const offsetY = (maxY + minY) / 2;

        canvas.height = height + WIREFRAME_CANVAS_PADDING;
        canvas.width = width + WIREFRAME_CANVAS_PADDING;
        canvas.style.translate =
            `${wireframe.wireframe.displacement.x + halfWidth + minX}px ` +
            `${wireframe.wireframe.displacement.y + halfHeight + minY}px ` +
            `${wireframe.wireframe.displacement.z * -1}px`;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = PALETTE_COLORS[ColorMode.Default][wireframe.wireframe.color];

        projectedSegments.map(s => {
            plotLine(
                context,
                s[0] + halfWidth - offsetX,
                s[1] + halfHeight - offsetY,
                s[2] + halfWidth - offsetX,
                s[3] + halfHeight - offsetY,
                wireframe.wireframe.interlaced,
            );
        });
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setState({ currentComponent: `wireframes-${index}` });
    };

    useEffect(() => {
        const projectedSegments: number[][] = [];
        const xValues: number[] = [];
        const yValues: number[] = [];
        const depthScalingFactor = 256;
        wireframe.segments.map(s => {
            const x0 = Math.round(s.fromVertex.x * depthScalingFactor / (s.fromVertex.z + s.fromVertex.parallax + depthScalingFactor));
            const y0 = Math.round(s.fromVertex.y * depthScalingFactor / (s.fromVertex.z + s.fromVertex.parallax + depthScalingFactor));
            const x1 = Math.round(s.toVertex.x * depthScalingFactor / (s.toVertex.z + s.toVertex.parallax + depthScalingFactor));
            const y1 = Math.round(s.toVertex.y * depthScalingFactor / (s.toVertex.z + s.toVertex.parallax + depthScalingFactor));
            projectedSegments.push([x0, y0, x1, y1]);
            xValues.push(x0, x1);
            yValues.push(y0, y1);
        });

        draw(
            projectedSegments,
            Math.min(...xValues),
            Math.min(...yValues),
            Math.max(...xValues),
            Math.max(...yValues),
        );
    }, [
        wireframe.wireframe.color,
        wireframe.wireframe.displacement,
        wireframe.wireframe.interlaced,
        wireframe.segments,
    ]);

    return <canvas
        ref={canvasRef}
        style={{
            borderRadius: highlighted ? .5 : 0,
            imageRendering: 'pixelated',
            opacity: wireframe.wireframe.transparency === Transparency.None ? 1 : .5,
            outline: highlighted ? '.5px solid rgba(0, 255, 0, .5)' : 'none',
            position: 'absolute',
            zIndex: highlighted ? 999999 : 120000,
        }}
        onClick={handleClick}
    />;
}
