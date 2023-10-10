import { MessageService, nls } from '@theia/core';
import { QuickPickItem, QuickPickOptions, QuickPickService } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { OutputChannelManager } from '@theia/output/lib/browser/output-channel';
import { OutputContribution } from '@theia/output/lib/browser/output-contribution';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesMigrateFromPreviewTo100 } from './migrations/ves-migrate-preview-to-1-0-0';
import { MigrationRegistry } from './ves-migrate-types';

@injectable()
export class VesMigrateService {
  static CHANNEL_NAME = 'Migrations';

  @inject(FileService)
  protected readonly fileService: FileService;
  @inject(MessageService)
  protected readonly messageService: MessageService;
  @inject(OutputChannelManager)
  protected readonly outputChannelManager: OutputChannelManager;
  @inject(OutputContribution)
  protected readonly outputContribution: OutputContribution;
  @inject(QuickPickService)
  protected readonly quickPickService: QuickPickService;
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;
  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  protected _migrations: MigrationRegistry = {};
  get migrations(): MigrationRegistry {
    return this._migrations;
  }

  protected registerMigrations(): void {
    if (Object.keys(this.migrations).length) {
      return;
    }

    const migrations = [
      VesMigrateFromPreviewTo100
    ];

    const channelName = VesMigrateService.CHANNEL_NAME;
    const channel = this.outputChannelManager.getChannel(channelName);

    migrations.map(migration => {
      const id = this.vesCommonService.nanoid();
      this._migrations[id] = new migration(
        this.fileService,
        this.messageService,
        this.outputChannelManager,
        this.quickPickService,
        this.vesCommonService,
        this.workspaceService,
        channel
      );
    });
  }

  migrate(): void {
    this.registerMigrations();
    this.migrationQuickPick();
  }

  protected migrationQuickPick(): void {
    const quickPickOptions: QuickPickOptions<QuickPickItem> = {
      title: nls.localize('vuengine/migrate/migrateProjectMigration', 'Migrate Project: Migration'),
      placeholder: nls.localize('vuengine/migrate/chooseMigration', 'Choose migration to apply'),
      // eslint-disable-next-line max-len
      description: nls.localize('vuengine/migrate/chooseMigrationWarning', 'Warning! Migrations will modify project files. It is strongly recommended to utilize source control to be able to roll back should something fail.'),
      step: 3,
      totalSteps: 3,
    };

    const items: QuickPickItem[] = [];

    // eslint-disable-next-line guard-for-in
    Object.keys(this.migrations).map(id => {
      const migration = this.migrations[id];
      items.push({
        id,
        label: `${migration.fromVersion} → ${migration.toVersion}`,
        detail: migration.description,
      });
    });

    this.quickPickService.show<QuickPickItem>(items, quickPickOptions).then(selection => {
      if (!selection) {
        return;
      }

      this.executeMigration(selection.id!);
    });
  }

  protected async executeMigration(id: string): Promise<void> {
    const channelName = VesMigrateService.CHANNEL_NAME;
    const channel = this.outputChannelManager.getChannel(channelName);
    this.outputChannelManager.selectedChannel = channel;

    channel.appendLine('# Migration Report');

    const migration = this.migrations[id];
    const success = await migration.migrate();

    const viewReportAction = nls.localize('vuengine/migrate/viewReport', 'View Report');
    let answer = '';
    if (!success) {
      answer = await this.messageService.error(
        nls.localize('vuengine/migrate/migrationHasFailed', 'Migration has failed.'),
        viewReportAction
      ) ?? '';
    } else {
      answer = await this.messageService.info(
        nls.localize('vuengine/migrate/migrationFailed', 'Migration successful.'),
        viewReportAction
      ) ?? '';
    }

    if (answer === viewReportAction) {
      this.showOutputView();
    }
  }

  protected showOutputView(): void {
    this.outputContribution.openView({ reveal: true }).then(view => {
      view.activate();
    });
  }
}
