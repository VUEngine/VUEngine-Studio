import { MessageService, nls } from '@theia/core';
import { QuickPickItem, QuickPickOptions, QuickPickService } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesGlobService } from '../../glob/common/ves-glob-service-protocol';
import { get as createVuengineProjectFile } from './migrations/create-vuengine-project-file';
import { MigrationRegistry, Version } from './ves-migrate-types';

@injectable()
export class VesMigrateService {
  @inject(FileService)
  protected readonly fileService: FileService;
  @inject(MessageService)
  protected readonly messageService: MessageService;
  @inject(QuickPickService)
  protected readonly quickPickService: QuickPickService;
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;
  @inject(VesGlobService)
  protected readonly vesGlobService: VesGlobService;
  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  protected _migrations: MigrationRegistry = {};
  get migrations(): MigrationRegistry {
    return this._migrations;
  }

  @postConstruct()
  protected async init(): Promise<void> {
    this.registerMigrations();
  }

  protected registerMigrations(): void {
    const migrations = [
      createVuengineProjectFile(
        this.fileService,
        this.messageService,
        this.vesCommonService,
        this.vesGlobService,
        this.workspaceService,
      ),
    ];

    migrations.map(migration => {
      const id = this.vesCommonService.nanoid();
      this._migrations[id] = migration;
    });
  }

  migrate(): void {
    this.fromVersionQuickPick();
  }

  protected fromVersionQuickPick(): void {
    const quickPickOptions: QuickPickOptions<QuickPickItem> = {
      title: nls.localize('vuengine/migrate/migrateProjectFromVersion', 'Migrate Project: From Version'),
      placeholder: nls.localize('vuengine/migrate/chooseFromVersion', 'Choose VUEngine Studio version to migrate from'),
      step: 1,
      totalSteps: 3,
    };

    const fromVersionsWithMigrations: string[] = [];
    Object.values(this.migrations).map(migration => {
      if (!fromVersionsWithMigrations.includes(migration.fromVersion)) {
        fromVersionsWithMigrations.push(migration.fromVersion);
      };
    });

    const items: QuickPickItem[] = [];

    // eslint-disable-next-line guard-for-in
    for (const version in Version) {
      if (fromVersionsWithMigrations.includes(version)) {
        items.push({
          label: version
        });
      }
    }

    this.quickPickService.show<QuickPickItem>(items, quickPickOptions).then(selection => {
      if (!selection) {
        return;
      }

      this.toVersionQuickPick(selection.label);
    });
  }

  protected toVersionQuickPick(fromVersion: string): void {
    const quickPickOptions: QuickPickOptions<QuickPickItem> = {
      title: nls.localize('vuengine/migrate/migrateProjectToVersion', 'Migrate Project: To Version'),
      placeholder: nls.localize('vuengine/migrate/chooseToVersion', 'Choose VUEngine Studio version to migrate to'),
      step: 2,
      totalSteps: 3,
    };

    const toVersionsOfFromVersionWithMigrations: string[] = [];
    Object.values(this.migrations)
      .filter(migration => migration.fromVersion === fromVersion)
      .map(migration => {
        if (!toVersionsOfFromVersionWithMigrations.includes(migration.toVersion)) {
          toVersionsOfFromVersionWithMigrations.push(migration.toVersion);
        };
      });

    const items: QuickPickItem[] = [];

    // eslint-disable-next-line guard-for-in
    for (const version in Version) {
      if (toVersionsOfFromVersionWithMigrations.includes(version)) {
        items.push({
          label: version
        });
      }
    }

    this.quickPickService.show<QuickPickItem>(items, quickPickOptions).then(selection => {
      if (!selection) {
        return;
      }

      this.migrationQuickPick(fromVersion, selection.label);
    });
  }

  protected migrationQuickPick(fromVersion: string, toVersion: string): void {
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
      if (migration.fromVersion === fromVersion && migration.toVersion === toVersion) {
        items.push({
          id,
          label: migration.name,
          detail: migration.description,
        });
      }
    });

    this.quickPickService.show<QuickPickItem>(items, quickPickOptions).then(selection => {
      if (!selection) {
        return;
      }

      this.migrations[selection.id!].function();
    });
  }
}
