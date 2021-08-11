import { join as joinPath } from 'path';
import { inject, injectable } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { PreviewUri } from '@theia/preview/lib/browser';

@injectable()
export class VesDocumentationService {
  @inject(EnvVariablesServer)
  protected readonly envVariablesServer: EnvVariablesServer;

  protected async getResourcesPath(): Promise<string> {
    const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
    const applicationPath = envVar && envVar.value ? envVar.value : '';
    return applicationPath;
  }

  protected async getHandbookRoot(): Promise<string> {
    return joinPath(
      await this.getResourcesPath(),
      'documentation',
      'vuengine-studio-documentation',
    );
  }

  async getHandbookIndex(): Promise<string> {
    const handbookRoot = await this.getHandbookRoot();
    return joinPath(handbookRoot, 'index.json');
  }

  async getHandbookUri(file: string): Promise<URI> {
    const handbookRoot = await this.getHandbookRoot();
    const docUri = new URI(joinPath(
      handbookRoot,
      ...(file + '.md').split('/'),
    ));

    return PreviewUri.encode(docUri);
  }
}
