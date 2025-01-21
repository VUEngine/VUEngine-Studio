import React, { useEffect, useRef } from 'react';
import { ColorMode, PALETTE_COLORS } from '../../../../../../core/browser/ves-common-types';
import { WIREFRAME_CANVAS_PADDING, WireframeData } from '../../ActorEditorTypes';

export interface MeshWireframeProps {
    wireframe: WireframeData
    style: Object
    onClick: (e: React.MouseEvent) => void
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
    const { wireframe, style, onClick } = props;
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
        const halfPadding = WIREFRAME_CANVAS_PADDING / 2;

        canvas.height = height + WIREFRAME_CANVAS_PADDING;
        canvas.width = width + WIREFRAME_CANVAS_PADDING;
        canvas.style.translate =
            `${wireframe.displacement.x + halfWidth + minX + halfPadding}px ` +
            `${wireframe.displacement.y + halfHeight + minY + halfPadding}px ` +
            `${wireframe.displacement.z * -1}px`;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = PALETTE_COLORS[ColorMode.Default][wireframe.color];

        projectedSegments.map(s => {
            plotLine(
                context,
                s[0] + halfWidth - offsetX,
                s[1] + halfHeight - offsetY,
                s[2] + halfWidth - offsetX,
                s[3] + halfHeight - offsetY,
                wireframe.interlaced,
            );
        });
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
        wireframe.color,
        wireframe.displacement,
        wireframe.interlaced,
        wireframe.segments,
    ]);

    return <canvas
        ref={canvasRef}
        style={style}
        onClick={onClick}
    />;
}
