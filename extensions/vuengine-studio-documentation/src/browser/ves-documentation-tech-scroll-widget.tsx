import { inject, injectable, postConstruct } from 'inversify';
import { join as joinPath } from 'path';
import { env } from 'process';
import { BaseWidget } from '@theia/core/lib/browser';
import { PreviewHandler, PreviewHandlerProvider } from '@theia/preview/lib/browser/preview-handler';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import URI from '@theia/core/lib/common/uri';

@injectable()
export class VesDocumentationTechScrollWidget extends BaseWidget {
    @inject(FileService) protected readonly fileService: FileService;

    protected previewHandler: PreviewHandler | undefined;
    static readonly ID = 'ves-documentation-tech-scroll';
    static readonly LABEL = 'Hardware Documentation';

    constructor(
        @inject(PreviewHandlerProvider) protected readonly previewHandlerProvider: PreviewHandlerProvider,
    ) {
        super();

        this.id = VesDocumentationTechScrollWidget.ID;
        this.title.label = VesDocumentationTechScrollWidget.LABEL;
        this.title.caption = VesDocumentationTechScrollWidget.LABEL;
        this.title.iconClass = 'fa fa-book';
        this.title.closable = true;
        this.node.tabIndex = 0;
    }

    @postConstruct()
    async init(): Promise<void> {
        const stsUri = new URI(joinPath(
            env.THEIA_APP_PROJECT_PATH ?? '',
            'documentation',
            'stsvb.html',
        ));
        const stsContent = await this.fileService.readFile(stsUri);
        const stsContentStr = stsContent.value.toString();

        const stsBody = new DOMParser().parseFromString(stsContentStr, 'text/html').body;

        this.node.innerHTML = '';
        this.node.appendChild(stsBody);

        this.update();
    }
}
