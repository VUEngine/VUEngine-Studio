import { inject, injectable } from 'inversify';
import { BaseWidget } from '@theia/core/lib/browser';
import { PreviewHandler, PreviewHandlerProvider } from '@theia/preview/lib/browser/preview-handler';
import URI from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';

@injectable()
export class VesDocumentationHandbookWidget extends BaseWidget {
    @inject(FileService) protected readonly fileService: FileService;

    protected previewHandler: PreviewHandler | undefined;
    static readonly ID = 'ves-documentation-handbook';
    static readonly LABEL = 'Handbook';

    constructor(
        @inject(PreviewHandlerProvider) protected readonly previewHandlerProvider: PreviewHandlerProvider,
    ) {
        super();

        this.id = VesDocumentationHandbookWidget.ID;
        this.title.label = VesDocumentationHandbookWidget.LABEL;
        this.title.caption = VesDocumentationHandbookWidget.LABEL;
        this.title.iconClass = 'fa fa-book';
        this.title.closable = true;
        this.node.tabIndex = 0;
    }

    async openDocument(documentUri: URI): Promise<void> {
        const fileContent = await this.fileService.readFile(documentUri);
        const content = fileContent.value.toString();

        const docTitle = content.substring(
            content.indexOf('title: ') + 6,
            content.indexOf('\n---\n')
        );
        const tabTitle = `${VesDocumentationHandbookWidget.LABEL}: ${docTitle}`;
        this.title.label = tabTitle;
        this.title.caption = tabTitle;

        // remove jekyll header
        const contentLines = content.split('\n');
        contentLines.splice(0, 5);
        let fixedContent = contentLines.join('\n');
        // fix image urls
        fixedContent = fixedContent.replace(/\/documentation\/images\//g, '../images/');

        this.previewHandler = this.previewHandlerProvider.findContribution(documentUri)[0];

        if (!this.previewHandler) {
            return undefined;
        }
        const contentElement = this.previewHandler.renderContent({ content: fixedContent, originUri: documentUri });
        this.node.innerHTML = '';
        if (contentElement) {
            // @ts-ignore
            this.node.appendChild(contentElement);
        }
        this.update();
    }
}