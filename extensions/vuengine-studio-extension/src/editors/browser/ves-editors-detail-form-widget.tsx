import { DetailFormWidget, jsonFormsConfig, JsonFormsDetailConfig } from '@eclipse-emfcloud/theia-tree-editor';
import { injectable } from '@theia/core/shared/inversify';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { VES_RENDERERS } from './renderers/ves-renderers';

@injectable()
export class VesDetailFormWidget extends DetailFormWidget {
    protected getJsonFormsConfig(): JsonFormsDetailConfig {
        return {
            ...jsonFormsConfig,
            renderers: [
                ...jsonFormsConfig.renderers,
                ...VES_RENDERERS,
            ],
        };
    }

    protected renderEmptyForms(): void {
        ReactDOM.render(
            <></>,
            this.node
        );
    }
}
