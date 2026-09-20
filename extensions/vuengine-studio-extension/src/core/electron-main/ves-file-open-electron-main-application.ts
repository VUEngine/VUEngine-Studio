import { app, BrowserWindow } from '@theia/core/electron-shared/electron';
import { FileUri } from '@theia/core/lib/common/file-uri';
import { Deferred, timeout } from '@theia/core/lib/common/promise-util';
import { MaybePromise } from '@theia/core/lib/common/types';
import { TheiaRendererAPI } from '@theia/core/lib/electron-main/electron-api-main';
import { ElectronMainApplication, ElectronMainCommandOptions } from '@theia/core/lib/electron-main/electron-main-application';
import { TheiaBrowserWindowOptions, TheiaElectronWindow } from '@theia/core/lib/electron-main/theia-electron-window';
import { injectable } from '@theia/core/shared/inversify';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Argv } from 'yargs';
import { VUENGINE_WORKSPACE_EXT } from '../../project/browser/ves-project-types';

const createYargs: (argv?: string[], cwd?: string) => Argv = require('yargs/yargs');

const WORKSPACE_EXTENSIONS = [`.${VUENGINE_WORKSPACE_EXT}`, '.theia-workspace', '.code-workspace'];
const FRONTEND_READY_TIMEOUT = 60_000;

/**
 * Opens the files the operating system hands to the application.
 *
 * Theia only ever understands such a file as a workspace to open: its
 * handleMainCommand resolves the [file] argument and passes it straight to
 * openWindowWithWorkspace, so "vuengine.app game.vb" opens the ROM as a
 * project folder, and on macOS nothing happens at all because the Finder's "Open With",
 * a drop onto the dock icon or "open -a" do not use the command line, they
 * emit an open-file event that Theia does not listen for.
 *
 * This handles both, and routes a file that is not a workspace to the
 * frontend's OpenerService instead.
 *
 * The complicated part is timing. A document opened while the application is closed
 * arrives during launch, long before a frontend exists to receive it, and a window
 * whose frontend has not started yet drops what it is sent. So paths are queued, and
 * the queue is flushed one at a time once a window reports itself ready. Whether the
 * frontend then found an opener cannot be known (see openFileInFrontend) so there
 * is nothing to retry on, and each file is offered to exactly one window.
 */
@injectable()
export class VesFileOpenElectronMainApplication extends ElectronMainApplication {
    protected readonly queuedFiles: string[] = [];
    protected startupFinished = false;
    protected flushingQueue = false;
    protected readonly readyWindows = new Set<number>();
    protected frontendReady = new Deferred<void>();

    async createWindow(asyncOptions: MaybePromise<TheiaBrowserWindowOptions> = this.getDefaultTheiaWindowOptions()): Promise<BrowserWindow> {
        const electronWindow = await super.createWindow(asyncOptions);
        const id = electronWindow.webContents.id;

        TheiaRendererAPI.onApplicationStateChanged(electronWindow.webContents, state => {
            if (state === 'ready') {
                this.readyWindows.add(id);
                this.frontendReady.resolve();
            }
        });
        electronWindow.on('closed', () => {
            this.readyWindows.delete(id);
            if (this.readyWindows.size === 0) {
                this.frontendReady = new Deferred<void>();
            }
        });

        return electronWindow;
    }

    protected hookApplicationEvents(): void {
        super.hookApplicationEvents();

        app.on('open-file', (event, filePath) => {
            event.preventDefault();
            this.handleOpenFile(filePath);
        });
    }

    protected async startBackend(): Promise<number> {
        const argument = this.documentArgument();
        if (argument === undefined || !await this.isDocument(path.resolve(process.cwd(), argument))) {
            return super.startBackend();
        }

        const argv = [...process.argv];
        process.argv.splice(process.argv.lastIndexOf(argument), 1);
        try {
            return await super.startBackend();
        } finally {
            process.argv.splice(0, process.argv.length, ...argv);
        }
    }

    protected documentArgument(): string | undefined {
        let file: string | undefined;
        createYargs(this.processArgv.getProcessArgvWithoutBin(), process.cwd())
            .help(false)
            .command('$0 [file]', false,
                cmd => cmd
                    .option('electronUserData', { type: 'string' })
                    .positional('file', { type: 'string' }),
                args => {
                    file = args.file;
                },
            ).parse();
        return file;
    }

    protected async isDocument(filePath: string): Promise<boolean> {
        try {
            return !await this.isWorkspace(await fs.realpath(filePath));
        } catch {
            return false;
        }
    }

    protected async handleOpenFile(filePath: string): Promise<void> {
        this.queuedFiles.push(filePath);
        if (this.startupFinished) {
            await this.flushQueuedFiles();
        }
    }

    protected async handleMainCommand(options: ElectronMainCommandOptions): Promise<void> {
        try {
            const workspaceIndex = await this.indexOfQueuedWorkspace();
            const queuedWorkspace = workspaceIndex < 0 ? undefined : this.queuedFiles.splice(workspaceIndex, 1)[0];
            if (queuedWorkspace !== undefined) {
                await this.openWindowWithWorkspace(queuedWorkspace);
                return;
            }

            const file = await this.resolveCommandLineFile(options);
            if (file !== undefined && !await this.isWorkspace(file)) {
                this.queuedFiles.push(file);
                if (!options.secondInstance) {
                    await super.handleMainCommand({ ...options, file: undefined });
                } else if (this.windows.size === 0) {
                    await this.openDefaultWindow();
                }
                return;
            }

            await super.handleMainCommand(options);
        } finally {
            if (!options.secondInstance) {
                this.startupFinished = true;
            }
            this.flushQueuedFiles();
        }
    }

    protected async resolveCommandLineFile(options: ElectronMainCommandOptions): Promise<string | undefined> {
        if (options.file === undefined) {
            return undefined;
        }
        try {
            return await fs.realpath(path.resolve(options.cwd, options.file));
        } catch {
            return undefined;
        }
    }

    protected async indexOfQueuedWorkspace(): Promise<number> {
        for (let index = 0; index < this.queuedFiles.length; index++) {
            if (await this.isWorkspace(this.queuedFiles[index])) {
                return index;
            }
        }
        return -1;
    }

    protected async isWorkspace(filePath: string): Promise<boolean> {
        const lowerCased = filePath.toLowerCase();
        if (WORKSPACE_EXTENSIONS.some(extension => lowerCased.endsWith(extension))) {
            return true;
        }
        try {
            return (await fs.stat(filePath)).isDirectory();
        } catch {
            return false;
        }
    }

    protected async flushQueuedFiles(): Promise<void> {
        if (this.flushingQueue) {
            return;
        }
        this.flushingQueue = true;
        try {
            while (this.queuedFiles.length > 0) {
                const filePath = this.queuedFiles.shift()!;
                try {
                    if (await this.isWorkspace(filePath)) {
                        await this.openWindowWithWorkspace(filePath);
                    } else {
                        await this.openFileInFrontend(filePath);
                    }
                } catch (error) {
                    console.error(`Could not open "${filePath}".`, error);
                }
            }
        } finally {
            this.flushingQueue = false;
        }
    }

    protected async openFileInFrontend(filePath: string): Promise<void> {
        if (this.windows.size === 0) {
            await this.openWindowWithWorkspace(''); // restore previous workspace.
        }

        await Promise.race([this.frontendReady.promise, timeout(FRONTEND_READY_TIMEOUT)]);
        const target = this.readyWindow();
        if (target === undefined) {
            console.error(`Could not open "${filePath}": no window was ready to take it.`);
            return;
        }

        await target.openUrl(FileUri.create(filePath).toString());

        if (target.window.isMinimized()) {
            target.window.restore();
        }
        target.window.show();
        target.window.focus();
    }

    protected readyWindow(): TheiaElectronWindow | undefined {
        for (const id of this.activeWindowStack) {
            if (this.readyWindows.has(id)) {
                return this.windows.get(id);
            }
        }
        return undefined;
    }
}
