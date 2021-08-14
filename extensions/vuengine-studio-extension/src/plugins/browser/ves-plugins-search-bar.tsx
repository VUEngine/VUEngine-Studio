import * as React from '@theia/core/shared/react';
import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { ReactWidget, Message } from '@theia/core/lib/browser/widgets';
import { VesPluginsSearchModel } from './ves-plugins-search-model';

@injectable()
export class VesPluginsSearchBar extends ReactWidget {

    @inject(VesPluginsSearchModel)
    protected readonly model: VesPluginsSearchModel;

    @postConstruct()
    protected init(): void {
        this.id = 'ves-plugins-search-bar';
        this.addClass('theia-vsx-extensions-search-bar');
        this.model.onDidChangeQuery((query: string) => this.updateSearchTerm(query));
    }

    protected input: HTMLInputElement | undefined;

    protected render(): React.ReactNode {
        return <input type='text'
            ref={input => this.input = input || undefined}
            defaultValue={this.model.query}
            className='theia-input'
            placeholder='Search Plugins'
            onChange={this.updateQuery}>
        </input>;
    }

    protected updateQuery = (e: React.ChangeEvent<HTMLInputElement>) => this.model.query = e.target.value;

    protected updateSearchTerm(term: string): void {
        if (this.input) {
            this.input.value = term;
        }
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        if (this.input) {
            this.input.focus();
        }
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);
        this.update();
    }
}
