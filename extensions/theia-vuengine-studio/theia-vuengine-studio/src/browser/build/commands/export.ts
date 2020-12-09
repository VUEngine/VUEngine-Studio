import { CommandService, environment } from "@theia/core";
import { CommonCommands, ConfirmDialog, PreferenceService } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { FileDialogService, SaveFileDialogProps } from "@theia/filesystem/lib/browser";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { existsSync } from "fs";
import {
    getRomPath,
} from "../../common";
import { VesBuildCommand } from "../commands";

export async function exportCommand(
    commandService: CommandService,
    fileService: FileService,
    fileDialogService: FileDialogService,
    preferenceService: PreferenceService,
    workspaceService: WorkspaceService
) {
    const romPath = getRomPath(workspaceService);

    if (existsSync(romPath)) {
        exportRom(commandService, fileService, fileDialogService, preferenceService, workspaceService, romPath);
    } else {
        commandService.executeCommand(VesBuildCommand.id);
        // TODO: queue export to run after build finishes
        // queueExportRom(...)
    }
}

async function exportRom(commandService: CommandService, fileService: FileService, fileDialogService: FileDialogService, preferenceService: PreferenceService, workspaceService: WorkspaceService, romPath: string) {
    const romUri = new URI(romPath);
    let exists: boolean = false;
    let overwrite: boolean = false;
    let selected: URI | undefined;
    const saveFilterDialogProps: SaveFileDialogProps = {
        title: "Export ROM",
        // TODO: file name based on project title
        inputValue: "Game Title.vb"//romUri.path.base
    };
    const romStat = await fileService.resolve(romUri);
    do {
        selected = await fileDialogService.showSaveDialog(saveFilterDialogProps, romStat);
        if (selected) {
            exists = await fileService.exists(selected);
            if (exists) {
                overwrite = await confirmOverwrite(selected);
            }
        }
    } while (selected && exists && !overwrite);
    if (selected) {
        try {
            await commandService.executeCommand(CommonCommands.SAVE.id);
            await fileService.copy(romUri, selected, { overwrite });
        } catch (e) {
            console.warn(e);
        }
    }
}

async function confirmOverwrite(uri: URI): Promise<boolean> {
    // Electron already handles the confirmation so do not prompt again.
    if (isElectron()) {
        return true;
    }
    // Prompt users for confirmation before overwriting.
    const confirmed = await new ConfirmDialog({
        title: 'Overwrite',
        msg: `Do you really want to overwrite "${uri.toString()}"?`
    }).open();
    return !!confirmed;
}

function isElectron(): boolean {
    return environment.electron.is();
}