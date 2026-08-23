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

/** Where the highlight is painted, over the picture rather than into it. */
const HIGHLIGHT_LINE_WIDTH = 1;

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

    protected displayMode: VbDisplayMode = VB_DEFAULT_DISPLAY_MODE;
    protected scale = 'auto';

    constructor(instanceId: string) {
        super();
        this.id = `ves-emulator-panel:${instanceId}:${EmulatorPanelType.SCREEN}`;
        this.title.label = nls.localize('vuengine/emulator/panels/screen', 'Screen');
        this.title.caption = this.title.label;
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

        // The overlay matches the picture exactly, in both the backing store
        // it draws into and the size it is stretched to, so a rectangle in
        // one lands on the same pixels in the other.
        const overlay = this.overlayCanvas;
        if (overlay) {
            if (overlay.width !== width || overlay.height !== height) {
                overlay.width = width;
                overlay.height = height;
            }
            overlay.style.width = canvas.style.width;
            overlay.style.height = canvas.style.height;
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
        context.clearRect(0, 0, overlay.width, overlay.height);
        if (this.highlights.length === 0) {
            return;
        }

        const { layout, eyes } = this.displayMode;
        // OVERLAY shows whichever eye it was asked for; every other layout
        // puts both of them somewhere on the canvas.
        const showLeft = layout !== VbStereoLayout.OVERLAY || eyes !== VbEyes.RIGHT;
        const showRight = layout !== VbStereoLayout.OVERLAY || eyes !== VbEyes.LEFT;

        context.strokeStyle = 'rgba(255, 64, 64, 0.9)';
        context.fillStyle = 'rgba(255, 64, 64, 0.18)';
        context.lineWidth = HIGHLIGHT_LINE_WIDTH;

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

        // Half-pixel inset so a one-pixel stroke lands on the pixel rather
        // than straddling the boundary between two.
        context.fillRect(x, y, width, height);
        context.strokeRect(x + 0.5, y + 0.5, Math.max(width - 1, 0), Math.max(height - 1, 0));
    }
}
