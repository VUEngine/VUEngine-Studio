import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Command } from '@theia/core/lib/common';
import { ViewContainer, PanelLayout, ViewContainerPart, Message } from '@theia/core/lib/browser';
import { generateWidgetId } from './ves-plugins-widget';
import { VesPluginsSourceOptions } from './ves-plugins-source';
import { VesPluginsModel } from './ves-plugins-model';
import { VesPluginsSearchMode } from './ves-plugins-search-model';
import { VesPluginsSearchBar } from './ves-plugins-search-bar';

export namespace VesPluginsViewCommands {

    const CATEGORY = 'Plugins';

    export const CLEAR_ALL: Command = {
        id: 'vesPlugins.clearAll',
        category: CATEGORY,
        label: 'Clear Search Results',
        iconClass: 'codicon codicon-clear-all'
    };
    export const HELP: Command = {
        id: 'vesPlugins.help',
        label: 'Show Handbook Page',
        iconClass: 'codicon codicon-book',
    };
}

@injectable()
export class VesPluginsViewContainer extends ViewContainer {

    static LABEL = 'Plugins';
    static ID = 'ves-plugins-view-container';

    @inject(VesPluginsSearchBar)
    protected readonly searchBar: VesPluginsSearchBar;

    @inject(VesPluginsModel)
    protected readonly model: VesPluginsModel;

    @postConstruct()
    protected init(): void {
        super.init();
        this.id = VesPluginsViewContainer.ID;
        this.addClass('ves-plugins-view-container');

        this.setTitleOptions({
            label: VesPluginsViewContainer.LABEL,
            iconClass: 'codicon codicon-plug',
            closeable: true
        });
    }

    protected onActivateRequest(msg: Message): void {
        this.searchBar.activate();
    }

    protected onAfterAttach(msg: Message): void {
        super.onBeforeAttach(msg);
        this.updateMode();
        this.toDisposeOnDetach.push(this.model.search.onDidChangeQuery(() => this.updateMode()));
    }

    protected configureLayout(layout: PanelLayout): void {
        layout.addWidget(this.searchBar);
        super.configureLayout(layout);
    }

    protected currentMode: VesPluginsSearchMode = VesPluginsSearchMode.Initial;
    protected readonly lastModeState = new Map<VesPluginsSearchMode, ViewContainer.State>();

    protected updateMode(): void {
        const currentMode = this.model.search.getModeForQuery();
        if (currentMode === this.currentMode) {
            return;
        }
        if (this.currentMode !== VesPluginsSearchMode.Initial) {
            this.lastModeState.set(this.currentMode, super.doStoreState());
        }
        this.currentMode = currentMode;
        const lastState = this.lastModeState.get(currentMode);
        if (lastState) {
            super.doRestoreState(lastState);
        } else {
            for (const part of this.getParts()) {
                this.applyModeToPart(part);
            }
        }

        const specialWidgets = this.getWidgetsForMode();
        if (specialWidgets?.length) {
            const widgetChecker = new Set(specialWidgets);
            const relevantParts = this.getParts().filter(part => widgetChecker.has(part.wrapped.id));
            relevantParts.forEach(part => {
                part.collapsed = false;
                part.show();
            });
        }
    }

    protected registerPart(part: ViewContainerPart): void {
        super.registerPart(part);
        this.applyModeToPart(part);
    }

    protected applyModeToPart(part: ViewContainerPart): void {
        if (this.shouldShowWidget(part)) {
            part.show();
        } else {
            part.hide();
        }
    }

    protected shouldShowWidget(part: ViewContainerPart): boolean {
        const widgetsToShow = this.getWidgetsForMode();
        if (widgetsToShow.length) {
            return widgetsToShow.includes(part.wrapped.id);
        }
        return part.wrapped.id !== generateWidgetId(VesPluginsSourceOptions.SEARCH_RESULT);
    }

    protected getWidgetsForMode(): string[] {
        switch (this.currentMode) {
            case VesPluginsSearchMode.Installed:
                return [generateWidgetId(VesPluginsSourceOptions.INSTALLED)];
            case VesPluginsSearchMode.Recommended:
                return [generateWidgetId(VesPluginsSourceOptions.RECOMMENDED)];
            case VesPluginsSearchMode.Search:
                return [generateWidgetId(VesPluginsSourceOptions.SEARCH_RESULT)];
            default:
                return [];
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected doStoreState(): any {
        const modes: VesPluginsViewContainer.State['modes'] = {};
        for (const mode of this.lastModeState.keys()) {
            modes[mode] = this.lastModeState.get(mode);
        }
        return {
            query: this.model.search.query,
            modes
        };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected doRestoreState(state: any): void {
        for (const key in state.modes) {
            if (state.modes.hasOwnProperty(key)) {
                const mode = Number(key) as VesPluginsSearchMode;
                const modeState = state.modes[mode];
                if (modeState) {
                    this.lastModeState.set(mode, modeState);
                }
            }
        }
        this.model.search.query = state.query;
    }

    protected getToggleVisibilityGroupLabel(): string {
        return 'a/Views';
    }
}

export namespace VesPluginsViewContainer {
    export interface State {
        query: string;
        modes: {
            [mode: number]: ViewContainer.State | undefined
        }
    }
}
