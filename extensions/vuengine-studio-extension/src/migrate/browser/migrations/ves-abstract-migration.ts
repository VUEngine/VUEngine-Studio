import { MessageService } from '@theia/core';
import { QuickPickService } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { OutputChannel, OutputChannelManager } from '@theia/output/lib/browser/output-channel';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import { VesGlobService } from '../../../glob/common/ves-glob-service-protocol';
import { Version } from '../ves-migrate-types';

export abstract class VesAbstractMigration {
    protected readonly fileService: FileService;
    protected readonly messageService: MessageService;
    protected readonly outputChannelManager: OutputChannelManager;
    protected readonly quickPickService: QuickPickService;
    protected readonly vesCommonService: VesCommonService;
    protected readonly vesGlobService: VesGlobService;
    protected readonly workspaceService: WorkspaceService;

    protected channel: OutputChannel;

    fromVersion: Version;
    toVersion: Version;
    description: string;

    constructor(
        fileService: FileService,
        messageService: MessageService,
        outputChannelManager: OutputChannelManager,
        quickPickService: QuickPickService,
        vesCommonService: VesCommonService,
        vesGlobService: VesGlobService,
        workspaceService: WorkspaceService,
        channel: OutputChannel
    ) {
        this.fileService = fileService;
        this.messageService = messageService;
        this.outputChannelManager = outputChannelManager;
        this.quickPickService = quickPickService;
        this.vesCommonService = vesCommonService;
        this.vesGlobService = vesGlobService;
        this.workspaceService = workspaceService;

        this.channel = channel;
    }

    abstract migrate(): Promise<boolean>;

    protected appendError(line: string): void {
        this.appendReportLine(`\nERROR: ${line}\n`);
    }

    protected appendHeadline(line: string): void {
        this.appendReportLine(`\n## ${line}`);
    }

    protected appendInfo(line: string, success: boolean): void {
        this.appendReportLine(`${success ? '[x]' : '[ ]'} ${line}`);
    }

    private appendReportLine(line: string): void {
        this.channel.appendLine(line);
    }
}
