import { PreferenceService } from '@theia/core/lib/browser';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import * as iconv from 'iconv-lite';
import * as nunjucks from 'nunjucks';
import { VesBuildPathsService } from '../../build/browser/ves-build-paths-service';
import { VesPluginsService } from '../../plugins/browser/ves-plugins-service';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { ProjectFileTemplate, ProjectFileTemplateEncoding, ProjectFileTemplateMode } from '../../project/browser/ves-project-types';

@injectable()
export class VesCodeGenService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(PreferenceService)
  protected preferenceService: PreferenceService;
  @inject(VesBuildPathsService)
  protected vesBuildPathsService: VesBuildPathsService;
  @inject(VesPluginsService)
  protected vesPluginsService: VesPluginsService;
  @inject(VesProjectService)
  protected vesProjectService: VesProjectService;
  @inject(WorkspaceService)
  protected workspaceService: WorkspaceService;

  @postConstruct()
  protected async init(): Promise<void> {
    this.preferenceService.ready.then(async () => {
      this.vesPluginsService.ready.then(async () => {
        await this.configureTemplateEngine();

        this.vesPluginsService.onDidChangeInstalledPlugins(async () =>
          this.handlePluginChange());
      });
    });
  }

  async generateAll(): Promise<void> {
    /*
    await Promise.all(Object.keys(this.templates.templates).map(async templateId => {
      // TODO: make it possible to render all dynamic templates triggered by fileWithEndingChanged,
      // like BrightnessRepeatSpec.c
      await this.renderTemplate(templateId);
    }));
    */
  }

  async renderTemplateToFile(targetUri: URI, templateString: string, data: object, encoding: ProjectFileTemplateEncoding = ProjectFileTemplateEncoding.utf8): Promise<void> {
    const renaderedTemplateData = nunjucks.renderString(templateString, data);
    // await this.fileService.delete();
    await this.fileService.writeFile(
      targetUri,
      BinaryBuffer.wrap(iconv.encode(renaderedTemplateData, encoding))
    );
  }

  async renderTemplate(templateId: string, itemData?: unknown): Promise<void> {
    await this.vesProjectService.ready;
    const template = this.vesProjectService.getProjectDataTemplate(templateId);
    if (!template) {
      console.warn(`Template with ID ${templateId} not found.`);
      return;
    }

    const encoding = template.encoding ? template.encoding : ProjectFileTemplateEncoding.utf8;

    const data = {
      item: itemData,
      project: this.vesProjectService.getProjectData()
    };

    switch (template.mode) {
      default:
      case ProjectFileTemplateMode.single:
        await this.renderFileFromTemplate(template, data, encoding);
        break;
    }
  }

  protected async handlePluginChange(): Promise<void> {
    /* this.templates.events.installedPluginsChanged.map(async templateId => {
      await this.renderTemplate(templateId);
    }); */
  }

  protected async renderFileFromTemplate(
    template: ProjectFileTemplate,
    data: object,
    encoding: ProjectFileTemplateEncoding
  ): Promise<void> {
    const templateUri = template.template as URI;
    let templateString = '';
    try {
      templateString = (await this.fileService.readFile(templateUri)).value.toString();
    } catch (error) {
      console.error(`Could not read template file at ${templateUri.path.toString()}`);
    }

    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (workspaceRootUri) {
      template.target = template.target
        .replace(/\$\{([\s\S]*?)\}/ig, match => {
          match = match.substring(2, match.length - 1);
          // @ts-ignore
          return this.getByKey(data.item, match);
        });

      const targetPathParts = template.target.split('/');
      let targetUri = workspaceRootUri;
      targetPathParts.forEach(targetPathPart => {
        targetUri = targetUri.resolve(targetPathPart);
      });

      await this.renderTemplateToFile(targetUri, templateString, data, encoding);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getByKey(o: any, s: string): any {
    // convert indexes to properties
    s = s.replace(/\[(\w+)\]/g, '.$1');
    // strip leading dot
    s = s.replace(/^\./, '');
    const a = s.split('.');
    for (let i = 0, n = a.length; i < n; ++i) {
      const k = a[i];
      if (k in o) {
        o = o[k];
      } else {
        return '';
      }
    }
    return o;
  }

  protected async configureTemplateEngine(): Promise<void> {
    const engineCoreUri = await this.vesBuildPathsService.getEngineCoreUri();
    const env = nunjucks.configure(await this.fileService.fsPath(engineCoreUri));

    // add filters
    env.addFilter('basename', (value: string, ending: boolean = true) => {
      /*
      let base = basename(value);
      if (!ending) {
        base = base.replace(/\.[^/.]+$/, '');
      }
      return base;
      */
    });
    env.addFilter('values', (value: object) => Object.values(value));
    // @ts-ignore
    env.addFilter('typeId', (arr: unknown[], typeId: string) => arr.filter(item => item.typeId === typeId));
    env.addFilter('toUpperSnakeCase', (value: string) => this.toUpperSnakeCase(value));
    env.addFilter('unique', (values: Array<string>, attribute?: string) => {
      if (attribute) {
        // array of objects with unique given attribute
        // @ts-ignore
        return [...new Map(values.map(item => [item[attribute], item])).values()];
      } else {
        // array of unique values
        return values.filter((value, index, self) => self.indexOf(value) === index);
      }
    });
    env.addFilter('hexToInt', (value: string) => parseInt(value, 16));
    env.addFilter('intToHex', (value: number, length?: number) => value.toString(16).toUpperCase().padStart(
      length === 8 ? 10 : length === 2 ? 4 : 6,
      length === 8 ? '0x00000000' : length === 2 ? '0x00' : '0x0000'
    ));
    env.addFilter('formatValue', (value: string) => {
      // @ts-ignore
      if (!isNaN(value) || value === 'true' || value === 'false') {
        return value;
      }
      return `"${value}"`;
    });

    // add functions
    /* env.addGlobal('fileExists', async (value: string) => {
      const exists = await this.fileService.exists(new URI(value).withScheme('file'));
      return exists;
    }); */
  }

  protected toUpperSnakeCase(key: string): string {
    // force lowercase first char
    let convertedKey = key.charAt(0).toLowerCase() + key.slice(1);
    // replace all whitespaces
    convertedKey = convertedKey.replace(/\s/g, '');
    // convert to upper snake case
    convertedKey = convertedKey.replace(/([A-Z])/g, $1 => '_' + $1.toLowerCase()).toUpperCase();

    return convertedKey;
  }
}
