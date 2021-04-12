import { CommandService, environment } from "@theia/core";
import { CommonCommands, ConfirmDialog } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import {
  FileDialogService,
  SaveFileDialogProps,
} from "@theia/filesystem/lib/browser";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { getRomPath } from "../../common/common-functions";
import { VesState } from "../../common/ves-state";
import { VesBuildCommand } from "../build-commands";

export async function exportCommand(
  commandService: CommandService,
  fileService: FileService,
  fileDialogService: FileDialogService,
  vesState: VesState
) {
  if (vesState.isExportQueued) {
    vesState.isExportQueued = false;
  } else if (vesState.buildStatus.active) {
    vesState.isExportQueued = true;
  } else if (vesState.outputRomExists) {
    exportRom(commandService, fileService, fileDialogService);
  } else {
    vesState.onDidChangeOutputRomExists(outputRomExists => {
      if (outputRomExists && vesState.isExportQueued) {
        vesState.isExportQueued = false;
        exportRom(commandService, fileService, fileDialogService);
      }
    })
    vesState.isExportQueued = true;
    commandService.executeCommand(VesBuildCommand.id);
  }
}

async function exportRom(
  commandService: CommandService,
  fileService: FileService,
  fileDialogService: FileDialogService
) {
  const romPath = getRomPath();
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
