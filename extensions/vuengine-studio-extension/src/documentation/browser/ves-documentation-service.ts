import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { PreviewUri } from '@theia/preview/lib/browser';
import { join } from 'path';
import { VesCommonService } from '../../branding/browser/ves-common-service';

@injectable()
export class VesDocumentationService {
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;

  protected async getHandbookRootUri(): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    return resourcesUri
      .resolve('documentation')
      .resolve('vuengine-studio-documentation');
  }

  async getHandbookIndex(): Promise<URI> {
    const handbookRootUri = await this.getHandbookRootUri();
    return handbookRootUri.resolve('index.json');
  }

  async getHandbookUri(file: string): Promise<URI> {
    if (file.startsWith('/documentation/')) {
      file = file.substring(14);
    }
    if (file.endsWith('/')) {
      file = file.substring(0, file.length - 1);
    }

    const handbookRootUri = await this.getHandbookRootUri();
    const docUri = handbookRootUri.resolve(join(...(`${file}.md`).split('/')));

    return PreviewUri.encode(docUri);
  }
}
