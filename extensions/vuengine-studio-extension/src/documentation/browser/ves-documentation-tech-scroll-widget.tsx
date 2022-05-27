import { nls } from '@theia/core';
import { BaseWidget } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { PreviewHandler, PreviewHandlerProvider } from '@theia/preview/lib/browser/preview-handler';
import { VesCommonService } from 'src/branding/browser/ves-common-service';

@injectable()
export class VesDocumentationTechScrollWidget extends BaseWidget {
    @inject(FileService)
    protected readonly fileService: FileService;
    @inject(PreviewHandlerProvider)
    protected readonly previewHandlerProvider: PreviewHandlerProvider;
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;

    protected previewHandler: PreviewHandler | undefined;
    static readonly ID = 'ves-documentation-tech-scroll';
    static readonly LABEL = nls.localize('vuengine/documentation/hardwareDocumentation', 'Hardware Documentation');

    constructor() {
        super();

        this.id = VesDocumentationTechScrollWidget.ID;
        this.title.label = VesDocumentationTechScrollWidget.LABEL;
        this.title.caption = VesDocumentationTechScrollWidget.LABEL;
        this.title.iconClass = 'codicon codicon-book';
        this.title.closable = true;
        this.node.tabIndex = 0;
    }

    @postConstruct()
    async init(): Promise<void> {
        const resourcesURi = await this.vesCommonService.getResourcesUri();
        const stsUri = resourcesURi
            .resolve('documentation')
            .resolve('stsvb.html');
        const stsContent = await this.fileService.readFile(stsUri);
        const stsContentStr = stsContent.value.toString();

        const stsBody = new DOMParser().parseFromString(stsContentStr, 'text/html').body;

        this.node.innerHTML = '';
        this.node.appendChild(stsBody);

        this.update();
    }
}
