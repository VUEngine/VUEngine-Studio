import { injectable } from '@theia/core/shared/inversify';
import { WorkspaceFrontendContribution } from '@theia/workspace/lib/browser';
import { VesEncodingOverride } from '../../core/browser/ves-encoding-registry';
import { ProjectFileTemplateEncoding } from './ves-project-types';

@injectable()
export class VesWorkspaceFrontendContribution extends WorkspaceFrontendContribution {
    configure(): void {
        super.configure();
        this.encodingRegistry.registerOverride({ encoding: ProjectFileTemplateEncoding.win1252, filename: 'Languages.c' } as VesEncodingOverride);
        this.updateEncodingOverrides();
    }
}
