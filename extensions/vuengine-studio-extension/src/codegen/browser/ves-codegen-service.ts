import { basename, dirname, join as joinPath } from 'path';
import * as nunjucks from 'nunjucks';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { isWindows } from '@theia/core';
import { FileChangesEvent } from '@theia/filesystem/lib/common/files';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VES_PREFERENCE_DIR } from '../../branding/browser/ves-branding-preference-configurations';
import { registeredTemplate, registeredTemplateExtra, registeredTemplateTarget } from './ves-codegen-types';

@injectable()
export class VesCodegenService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(VesBuildService)
  protected vesBuildService: VesBuildService;

  protected templates: registeredTemplate[] = [];

  @postConstruct()
  protected async init(): Promise<void> {
    this.configureTemplateEngine();

    this.templates = await this.getTemplateDefinitions();

    this.fileService.onDidFilesChange(async (fileChangesEvent: FileChangesEvent) => {
      for (const template of this.templates) {
        if (fileChangesEvent.contains(template.source)) {
          try {
            this.fileService.readFile(template.source).then(async content => {
              const dataKey = template.key || basename(template.source.toString()).split('.')[0].toLowerCase();
              let contentJson = {
                [dataKey]: JSON.parse(content.value.toString())
              };
              if (template.extra) {
                contentJson = await this.appendExtraContent(contentJson, template.extra);
              }
              for (const target of template.targets) {
                this.writeTemplate(target.uri, target.template, contentJson);
              }
            });
          } catch (e) {
            console.warn(e);
          }
        }
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async writeTemplate(targetUri: URI, templateUri: URI, data: any): Promise<void> {
    const templateData = (await this.fileService.readFile(templateUri)).value.toString();
    const renaderedTemplateData = nunjucks.renderString(templateData, data);
    this.fileService.writeFile(targetUri, BinaryBuffer.fromString(renaderedTemplateData));
  }

  protected async getTemplateDefinitions(): Promise<registeredTemplate[]> {
    const templates: registeredTemplate[] = [];
    const engineCorePath = await this.vesBuildService.getEngineCorePath();
    const workspaceRoot = this.getWorkspaceRoot();

    // TODO: support plugin and project level templates as well
    const templatesFileContent = await this.fileService.readFile(new URI(joinPath(
      engineCorePath, VES_PREFERENCE_DIR, 'templates.json'
    )));
    const templatesFileJson = JSON.parse(templatesFileContent.value.toString());
    for (const template of templatesFileJson) {
      const source = new URI(joinPath(workspaceRoot, ...template.source.split('/')));
      const targets: registeredTemplateTarget[] = [];
      const extra: registeredTemplateExtra = {};

      for (const target of template.targets) {
        targets.push({
          uri: new URI(joinPath(workspaceRoot, ...target.uri.split('/'))),
          template: new URI(joinPath(engineCorePath, VES_PREFERENCE_DIR, ...target.template.split('/')))
        });
      }

      if (template.extra) {
        for (const key in template.extra) {
          if (template.extra.hasOwnProperty(key)) {
            extra[key] = new URI(joinPath(workspaceRoot, ...template.extra[key].split('/')));
          }
        }
      }

      templates.push({ ...template, source, targets, extra });
    }

    return templates;
  }

  /* eslint-disable */
  protected async appendExtraContent(contentJson: any, extraTemplates: registeredTemplateExtra): Promise<any> {
    for (const key in extraTemplates) {
      if (extraTemplates.hasOwnProperty(key)) {
        const extraKey = extraTemplates[key];
        if (await this.fileService.exists(extraKey)) {
          const fileContent = await this.fileService.readFile(extraKey);
          contentJson[key] = JSON.parse(fileContent.value.toString());
        }
      }
    }

    return contentJson;
  }

  protected configureTemplateEngine(): void {
    const env = nunjucks.configure({});

    // add filters
    env.addFilter('basename', (value: string, ending: boolean = true) => {
      let base = basename(value);
      if (!ending) {
        base = base.replace(/\.[^/.]+$/, '');
      }
      return base;
    });
    env.addFilter('toUpperSnakeCase', (value: string) => this.toUpperSnakeCase(value));
    env.addFilter('unique', (values: string[]) => values.filter((value, index, self) => self.indexOf(value) === index));
    env.addFilter('hexToInt', (value: string) => parseInt(value, 16));
    env.addFilter('intToHex', (value: number) => value.toString(16).toUpperCase().padStart(10, '0x00000000'));

    // add functions
    env.addGlobal('fileExists', async (value: string) => this.fileService.exists(new URI(value)));
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

  protected getWorkspaceRoot(): string {
    const substrNum = isWindows ? 2 : 1;

    return window.location.hash.slice(-9) === 'workspace'
      ? dirname(window.location.hash.substring(substrNum))
      : window.location.hash.substring(substrNum);
  }
}
