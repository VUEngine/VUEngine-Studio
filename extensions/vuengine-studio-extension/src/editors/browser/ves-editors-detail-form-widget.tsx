import { DetailFormWidget, jsonFormsConfig, JsonFormsDetailConfig } from '@eclipse-emfcloud/theia-tree-editor';
import { injectable } from '@theia/core/shared/inversify';
import { createRoot } from 'react-dom/client';
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
        createRoot(this.node);
    }
}
