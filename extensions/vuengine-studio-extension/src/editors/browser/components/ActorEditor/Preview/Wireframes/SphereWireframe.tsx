import React, { useEffect, useRef } from 'react';
import { ColorMode, PALETTE_COLORS } from '../../../../../../core/browser/ves-common-types';
import { WIREFRAME_CANVAS_PADDING, WireframeData } from '../../ActorEditorTypes';

export interface SphereWireframeProps {
    wireframe: WireframeData
    style: Object
    onClick: (e: React.MouseEvent) => void
}

// bresenham circle algorithm
const plotCircle = (context: CanvasRenderingContext2D, radius: number, interlaced: boolean): void => {
    let x = radius;
    let y = 0;
    let radiusError = 1 - x;
    let lastStepPlotted = false;

    while (x >= y) {
        if (!interlaced || !lastStepPlotted) {
            context.fillRect(x + radius, y + radius, 1, 1);
            context.fillRect(y + radius, x + radius, 1, 1);
            context.fillRect(-x + radius, y + radius, 1, 1);
            context.fillRect(-y + radius, x + radius, 1, 1);
            context.fillRect(-x + radius, -y + radius, 1, 1);
            context.fillRect(-y + radius, -x + radius, 1, 1);
            context.fillRect(x + radius, -y + radius, 1, 1);
            context.fillRect(y + radius, -x + radius, 1, 1);
        }
        lastStepPlotted = !lastStepPlotted;
        y++;

        if (radiusError < 0) {
            radiusError += 2 * y + 1;
        } else {
            x--;
            radiusError += 2 * (y - x + 1);
        }
    }
};

export default function SphereWireframe(props: SphereWireframeProps): React.JSX.Element {
    const { wireframe, style, onClick } = props;
    // eslint-disable-next-line no-null/no-null
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const draw = (projectedRadius: number): void => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        const halfPadding = WIREFRAME_CANVAS_PADDING / 2;
        const diameter = 2 * wireframe.radius;
        canvas.height = diameter + WIREFRAME_CANVAS_PADDING;
        canvas.width = diameter + WIREFRAME_CANVAS_PADDING;
        canvas.style.translate =
            `${wireframe.displacement.x + halfPadding}px ` +
            `${wireframe.displacement.y + halfPadding}px ` +
            `${wireframe.displacement.z * -1}px`;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = PALETTE_COLORS[ColorMode.Default][wireframe.color];

        plotCircle(
            context,
            projectedRadius,
            wireframe.interlaced,
        );

        if (wireframe.drawCenter) {
            context.fillRect(wireframe.radius - 1, wireframe.radius - 1, 2, 2);
        }
    };

    useEffect(() => {
        // TODO
        const projectedRadius = wireframe.radius;

        draw(projectedRadius);
    }, [
        wireframe.drawCenter,
        wireframe.radius,
        wireframe.color,
        wireframe.displacement,
        wireframe.interlaced,
    ]);

    return <canvas
        ref={canvasRef}
        style={style}
        onClick={onClick}
    />;
}
