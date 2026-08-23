import { Message } from '@theia/core/shared/@lumino/messaging';
import { TabBar, Widget } from '@theia/core/shared/@lumino/widgets';
import PerfectScrollbar from 'perfect-scrollbar';

/**
 * A dock tab bar whose tabs scroll when there are more than fit.
 *
 * The same library, and so the same behaviour, as the shell's own tab bars
 * (Theia's `ScrollableTabBar`): perfect-scrollbar hides the native scrollbar
 * and draws a rail of its own, absolutely positioned over the tabs rather than
 * taking a strip of the row, and fading in on hover or while scrolling. Only
 * the scrolling part of that class is wanted here — the rest of it is the
 * shell's dropdown of open tabs and its dynamic tab sizing — and it expects
 * shell markup this dock does not have, so this attaches the scrollbar itself.
 *
 * The scrolling happens on a container wrapped around the list of tabs rather
 * than on the list itself, which is not optional: a tab bar re-renders that
 * list from a virtual DOM whenever its tabs change, and anything the scrollbar
 * had put inside it goes with the old nodes. Theia's own class wraps it for
 * the same reason.
 */
export class VesEmulatorTabBar extends TabBar<Widget> {

    protected readonly contentContainer: HTMLElement;
    protected scrollBar: PerfectScrollbar | undefined;

    constructor(options?: TabBar.IOptions<Widget>) {
        super(options);
        this.contentContainer = document.createElement('div');
        this.contentContainer.classList.add('lm-TabBar-content-container');
        // In front of whatever else the tab bar's node holds — the add button
        // — so that the tabs stay on the left and it stays on the right.
        this.node.insertBefore(this.contentContainer, this.node.firstChild);
        this.contentContainer.appendChild(this.contentNode);
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        this.scrollBar = new PerfectScrollbar(this.contentContainer, {
            // Horizontal only: the row is one tab tall.
            suppressScrollY: true,
            handlers: ['drag-thumb', 'keyboard', 'wheel', 'touch'],
        });
    }

    protected onBeforeDetach(msg: Message): void {
        this.scrollBar?.destroy();
        this.scrollBar = undefined;
        super.onBeforeDetach(msg);
    }

    /** Tabs opening and closing change how far the row reaches. */
    protected onUpdateRequest(msg: Message): void {
        super.onUpdateRequest(msg);
        this.scrollBar?.update();
    }

    protected onResize(msg: Widget.ResizeMessage): void {
        super.onResize(msg);
        this.scrollBar?.update();
    }
}
