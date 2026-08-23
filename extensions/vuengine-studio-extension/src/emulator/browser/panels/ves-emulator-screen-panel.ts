import { nls } from '@theia/core';
import { BaseWidget } from '@theia/core/lib/browser';
import { Message } from '@theia/core/shared/@lumino/messaging';
import { Widget } from '@theia/core/shared/@lumino/widgets';
import { VbDisplayMode, VbEyes, VbStereoLayout, VB_DEFAULT_DISPLAY_MODE, VB_SCREEN_WIDTH } from '../../common/ves-vb-constants';
import { EmulatorPanelType } from './ves-emulator-panel';
import { EmulatorScale } from '../ves-emulator-types';

/**
 * A rectangle in the Virtual Boy's own screen space, as the engine drew it.
 *
 * `parallax` is the sprite's, and is what separates the two eyes: the left is
 * drawn that far to the left of `x` and the right that far to the right, the
 * same way the VIP reads a world's `gp`.
 */
export interface VesScreenRect {
    x: number;
    y: number;
    width: number;
    height: number;
    parallax: number;
}

/**
 * How a highlight is drawn, matching the outline the Worlds panel puts round a
 * world's extents (`.ves-emulator-vip-canvas-extents`) — the two are the same
 * mark and have to agree, but one is CSS and this one is drawn, so the colour
 * is repeated by hand rather than shared.
 *
 * Green because the Virtual Boy's display is red: nothing underneath can be
 * this colour, so the outline never disappears into the picture. Dashed for
 * the same reason — a broken line reads as an annotation rather than as
 * something the game drew. Three on, three off is what a CSS `dashed` border
 * comes out as at this width, which is what the Worlds panel outlines a world
 * with, so the two marks read alike.
 *
 * The widths are in the machine's own pixels, so they scale up with the
 * picture and stay visible however large it is shown.
 */
const HIGHLIGHT_COLOR = 'rgb(0, 255, 0)';
const HIGHLIGHT_FILL = 'rgba(0, 255, 0, 0.15)';
const HIGHLIGHT_LINE_WIDTH = 1;
const HIGHLIGHT_DASH = [3, 3];

/**
 * The emulator's picture, in a panel of its own so it can be docked, resized
 * and rearranged alongside the debug views.
 *
 * The canvas is built imperatively rather than rendered by React: presentation
 * is transferred to the worker with transferControlToOffscreen, which can only
 * happen once per element, so an element that React might recreate would take
 * the picture with it.
 */
export class VesEmulatorScreenPanel extends BaseWidget {

    readonly kind = EmulatorPanelType.SCREEN;

    protected readonly frame: HTMLDivElement;
    protected canvasElement?: HTMLCanvasElement;
    /**
     * A second canvas over the picture, for marking things on it without
     * touching the frame the worker owns — that one has been transferred and
     * cannot be drawn to from here at all.
     */
    protected overlayCanvas?: HTMLCanvasElement;
    protected highlights: VesScreenRect[] = [];
    /** CSS pixels per machine pixel, i.e. how far the picture is scaled up. */
    protected overlayScale = 1;
    /** Device pixels per CSS pixel, so the outline is crisp on a HiDPI screen. */
    protected overlayRatio = 1;

    protected displayMode: VbDisplayMode = VB_DEFAULT_DISPLAY_MODE;
    protected scale = 'auto';

    constructor(instanceId: string) {
        super();
        this.id = `ves-emulator-panel:${instanceId}:${EmulatorPanelType.SCREEN}`;
        this.title.label = nls.localize('vuengine/emulator/panels/screen', 'Screen');
        this.title.closable = false;
        this.addClass('ves-emulator-screen-panel');

        this.frame = document.createElement('div');
        this.frame.className = 'ves-emulator-screen-frame';
        this.node.appendChild(this.frame);

        this.overlayCanvas = document.createElement('canvas');
        this.overlayCanvas.className = 'ves-emulator-screen-overlay';
        this.frame.appendChild(this.overlayCanvas);
    }

    /**
     * Hand out a fresh canvas for a new emulation session.
     *
     * Any previous one has already given up control to a worker that is going
     * away, so it is replaced rather than reused.
     */
    takeCanvas(): HTMLCanvasElement {
        this.canvasElement?.remove();
        const canvas = document.createElement('canvas');
        canvas.width = this.displayMode.width;
        canvas.height = this.displayMode.height;
        // Before the overlay, so the overlay stays on top of it.
        this.frame.insertBefore(canvas, this.overlayCanvas ?? null);
        this.canvasElement = canvas;
        this.relayout();
        return canvas;
    }

    setDisplayMode(mode: VbDisplayMode): void {
        this.displayMode = mode;
        this.relayout();
    }

    /**
     * Mark rectangles on the picture, or clear it with an empty list.
     *
     * The rectangles are in the Virtual Boy's screen space; placing them is
     * this panel's job, since only it knows how the current mode arranges the
     * two eyes.
     */
    setHighlights(rects: VesScreenRect[]): void {
        this.highlights = rects;
        this.drawHighlights();
    }

    setScale(scale: string): void {
        this.scale = scale;
        this.relayout();
    }

    protected onResize(msg: Widget.ResizeMessage): void {
        super.onResize(msg);
        this.relayout();
    }

    protected onAfterShow(msg: Message): void {
        super.onAfterShow(msg);
        this.relayout();
    }

    /** The panel has a size only once it is in the document. */
    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        this.relayout();
    }

    /**
     * Size the picture within the panel.
     *
     * The backing store is whatever the display mode presents at; this only
     * decides how large it appears. Integer scales are preferred so that the
     * pixels stay square and sharp.
     */
    protected relayout(): void {
        const canvas = this.canvasElement;
        if (!canvas) {
            return;
        }

        const available = this.node.getBoundingClientRect();
        const { width, height } = this.displayMode;
        if (available.width < 1 || available.height < 1) {
            return;
        }

        const fit = Math.min(available.width / width, available.height / height);
        let scale: number;
        if (this.scale === EmulatorScale.FIT) {
            scale = fit;
        } else if (this.scale === EmulatorScale.AUTO) {
            scale = Math.max(1, Math.floor(fit));
        } else {
            const requested = parseInt(this.scale.substring(1), 10);
            scale = Math.max(1, Math.min(Number.isFinite(requested) ? requested : 1, Math.floor(fit) || 1));
        }

        // Never overflow the panel, even at a forced scale in a small dock
        scale = Math.min(scale, fit);

        canvas.style.width = `${Math.floor(width * scale)}px`;
        canvas.style.height = `${Math.floor(height * scale)}px`;

        // The overlay covers the picture but is not drawn at its resolution:
        // its backing store is the size it is actually displayed at, in device
        // pixels. Drawn at the machine's own 384x224 it would be stretched by
        // the same `image-rendering: pixelated` the picture wants, turning a
        // one-pixel outline into a scaled-up staircase. At display resolution
        // the outline is a real hairline, and the machine's pixels are scaled
        // into place when drawing instead — see `overlayScale`.
        const overlay = this.overlayCanvas;
        if (overlay) {
            const displayed = { width: Math.floor(width * scale), height: Math.floor(height * scale) };
            const ratio = window.devicePixelRatio || 1;
            const backing = {
                width: Math.round(displayed.width * ratio),
                height: Math.round(displayed.height * ratio),
            };
            if (overlay.width !== backing.width || overlay.height !== backing.height) {
                overlay.width = backing.width;
                overlay.height = backing.height;
            }
            overlay.style.width = canvas.style.width;
            overlay.style.height = canvas.style.height;
            this.overlayScale = displayed.width / width;
            this.overlayRatio = ratio;
            this.drawHighlights();
        }
    }

    /**
     * Paint the marked rectangles, once per eye the current mode shows.
     *
     * Where those eyes end up on the canvas is the inverse of what the
     * renderer's shader does to get from a canvas pixel back to a source one,
     * so the two have to agree: side by side puts the right eye a screen
     * width along, Cyberscope squeezes each eye into 256 columns, and the
     * interleaved modes double one axis and offset the right eye by a line.
     */
    protected drawHighlights(): void {
        const overlay = this.overlayCanvas;
        const context = overlay?.getContext('2d');
        if (!overlay || !context) {
            return;
        }
        // Everything below is in CSS pixels: the transform absorbs the device
        // ratio, so a one-unit line is one screen pixel however dense the
        // display is, and the dash pattern is in those same units.
        context.setTransform(this.overlayRatio, 0, 0, this.overlayRatio, 0, 0);
        context.clearRect(0, 0, overlay.width / this.overlayRatio, overlay.height / this.overlayRatio);
        if (this.highlights.length === 0) {
            return;
        }

        const { layout, eyes } = this.displayMode;
        // OVERLAY shows whichever eye it was asked for; every other layout
        // puts both of them somewhere on the canvas.
        const showLeft = layout !== VbStereoLayout.OVERLAY || eyes !== VbEyes.RIGHT;
        const showRight = layout !== VbStereoLayout.OVERLAY || eyes !== VbEyes.LEFT;

        context.strokeStyle = HIGHLIGHT_COLOR;
        context.fillStyle = HIGHLIGHT_FILL;
        context.lineWidth = HIGHLIGHT_LINE_WIDTH;
        context.setLineDash(HIGHLIGHT_DASH);

        for (const rect of this.highlights) {
            if (showLeft) {
                this.strokeEye(context, rect, 0);
            }
            if (showRight) {
                this.strokeEye(context, rect, 1);
            }
        }
    }

    /** One rectangle, placed for one eye under the current layout. */
    protected strokeEye(context: CanvasRenderingContext2D, rect: VesScreenRect, eye: 0 | 1): void {
        // The VIP draws the left eye a parallax to the left of the world's x
        // and the right eye the same distance to the right.
        const sourceX = rect.x + (eye === 0 ? -rect.parallax : rect.parallax);
        let { x, y, width, height } = { x: sourceX, y: rect.y, width: rect.width, height: rect.height };

        switch (this.displayMode.layout) {
            case VbStereoLayout.SIDE_BY_SIDE:
                x += eye * VB_SCREEN_WIDTH;
                break;
            case VbStereoLayout.CYBERSCOPE: {
                // Each eye is squeezed into half of a 512-wide canvas.
                const squeeze = (this.displayMode.width / 2) / VB_SCREEN_WIDTH;
                x = x * squeeze + eye * (this.displayMode.width / 2);
                width *= squeeze;
                break;
            }
            case VbStereoLayout.HLI:
                y = y * 2 + eye;
                height *= 2;
                break;
            case VbStereoLayout.VLI:
                x = x * 2 + eye;
                width *= 2;
                break;
            default:
                // OVERLAY draws both eyes over the same pixels.
                break;
        }

        // From the machine's pixels into the ones actually on screen, which is
        // what this canvas is sized in.
        const left = x * this.overlayScale;
        const top = y * this.overlayScale;
        const across = width * this.overlayScale;
        const down = height * this.overlayScale;

        // The fill is not dashed — setLineDash only touches the stroke — so the
        // wash is continuous under a broken outline.
        context.fillRect(left, top, across, down);
        // Half-pixel inset so a one-pixel stroke lands on a pixel rather than
        // straddling the boundary between two, which is what would blur it.
        context.strokeRect(
            left + 0.5, top + 0.5, Math.max(across - 1, 0), Math.max(down - 1, 0)
        );
    }
}
