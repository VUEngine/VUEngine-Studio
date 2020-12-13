import { CommandService, environment } from "@theia/core";
import { CommonCommands, ConfirmDialog } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import {
  FileDialogService,
  SaveFileDialogProps,
} from "@theia/filesystem/lib/browser";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { existsSync } from "fs";
import { getRomPath } from "../../common";
import { VesStateModel } from "../../common/vesStateModel";
import { VesBuildCommand } from "../commands";

export async function exportCommand(
  commandService: CommandService,
  fileService: FileService,
  fileDialogService: FileDialogService,
  vesStateModel: VesStateModel,
  workspaceService: WorkspaceService
) {
  const romPath = getRomPath(workspaceService);

  if (existsSync(romPath)) {
    exportRom(commandService, fileService, fileDialogService, romPath);
  } else {
    commandService.executeCommand(VesBuildCommand.id);
    // TODO: use FileWatcher instead?
    vesStateModel.enqueueExport(setInterval(() => {
      if (existsSync(getRomPath(workspaceService))) {
        vesStateModel.unqueueExport();
        exportRom(commandService, fileService, fileDialogService, romPath);
      }
    }, 500));
  }
}

async function exportRom(
  commandService: CommandService,
  fileService: FileService,
  fileDialogService: FileDialogService,
  romPath: string
) {
  const romUri = new URI(romPath);
  let exists: boolean = false;
  let overwrite: boolean = false;
  let selected: URI | undefined;
  const saveFilterDialogProps: SaveFileDialogProps = {
    title: "Export ROM",
    // TODO: file name based on project title
    inputValue: "Game Title.vb", //romUri.path.base
  };
  const romStat = await fileService.resolve(romUri);
  do {
    selected = await fileDialogService.showSaveDialog(
      saveFilterDialogProps,
      romStat
    );
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
  if (environment.electron.is()) {
    return true;
  }
  const confirmed = await new ConfirmDialog({
    title: "Overwrite",
    msg: `Do you really want to overwrite "${uri.toString()}"?`,
  }).open();
  return !!confirmed;
}
