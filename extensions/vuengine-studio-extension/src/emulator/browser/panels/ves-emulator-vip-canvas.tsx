import * as React from '@theia/core/shared/react';

/**
 * Draws an ImageData at an integer zoom.
 *
 * The canvas stays at the source resolution and is scaled by CSS so that the
 * pixels stay crisp and a redraw does not have to repaint the scaled area.
 * Shared by the Characters and BGMaps panels, the two VIP inspectors that
 * rasterise VRAM to a bitmap rather than a table. Both put their own zoom
 * control in their Display group rather than sharing one, since the two
 * differ (a slider vs. the sidebar's single-cell preview zoom).
 *
 * `cellSize` opts into two overlays, both no-ops without it: grid lines every
 * `cellSize` source pixels (`showGrid`), and a highlight border around one
 * cell (`selected`, in cell rather than pixel units). `extents` is a third,
 * independent of `cellSize`: a border around an arbitrary rectangle given in
 * source pixels, which the Worlds panel uses to outline where on the screen a
 * world lands. All three are separate absolutely-positioned elements rather
 * than drawn into the bitmap itself, so none has to survive being scaled up
 * with the rest of the pixel data.
 */
export function VipCanvas(props: {
    image: ImageData,
    zoom: number,
    onPick?: (x: number, y: number) => void,
    title?: string,
    cellSize?: number,
    showGrid?: boolean,
    selected?: { x: number, y: number },
    extents?: { x: number, y: number, width: number, height: number },
}): React.JSX.Element {
    const { image, zoom, onPick, title, cellSize, showGrid, selected, extents } = props;
    const ref = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = ref.current;
        const context = canvas?.getContext('2d');
        if (canvas && context) {
            canvas.width = image.width;
            canvas.height = image.height;
            context.putImageData(image, 0, 0);
        }
    }, [image]);

    const width = image.width * zoom;
    const height = image.height * zoom;
    const cellPx = cellSize ? cellSize * zoom : 0;

    return <div className='ves-emulator-vip-canvas-wrapper' style={{ width, height }}>
        <canvas
            className='ves-emulator-vip-canvas'
            ref={ref}
            title={title}
            style={{ width, height }}
            onClick={event => {
                if (!onPick) {
                    return;
                }
                const bounds = event.currentTarget.getBoundingClientRect();
                onPick(
                    Math.floor((event.clientX - bounds.left) / zoom),
                    Math.floor((event.clientY - bounds.top) / zoom)
                );
            }}
        />
        {showGrid && cellPx > 0 &&
            <div
                className='ves-emulator-vip-canvas-grid'
                style={{ backgroundSize: `${cellPx}px ${cellPx}px` }}
            />
        }
        {selected && cellPx > 0 &&
            <div
                className='ves-emulator-vip-canvas-selection'
                style={{ width: cellPx, height: cellPx, left: selected.x * cellPx, top: selected.y * cellPx }}
            />
        }
        {extents &&
            // Clipped by a layer of its own, since a rectangle may well reach
            // past the image — a world can sit partly, or wholly, off screen.
            <div className='ves-emulator-vip-canvas-clip'>
                <div
                    className='ves-emulator-vip-canvas-extents'
                    style={{
                        width: extents.width * zoom,
                        height: extents.height * zoom,
                        left: extents.x * zoom,
                        top: extents.y * zoom,
                    }}
                />
            </div>
        }
    </div>;
}
