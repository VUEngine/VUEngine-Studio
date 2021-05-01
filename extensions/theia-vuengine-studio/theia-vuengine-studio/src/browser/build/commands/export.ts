import { injectable, inject } from "inversify";
import { CommandService, environment } from "@theia/core";
import { CommonCommands, ConfirmDialog } from "@theia/core/lib/browser";
import URI from "@theia/core/lib/common/uri";
import { FileDialogService, SaveFileDialogProps } from "@theia/filesystem/lib/browser";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { getRomPath } from "../../common/common-functions";
import { VesState } from "../../common/ves-state";
import { VesBuildCommands } from "../build-commands";

@injectable()
export class VesBuildExportCommand {
  @inject(CommandService) protected readonly commandService: CommandService;
  @inject(FileService) protected readonly fileService: FileService;
  @inject(FileDialogService) protected readonly fileDialogService: FileDialogService;
  @inject(VesState) protected readonly vesState: VesState;

  async execute() {
    if (this.vesState.isExportQueued) {
      this.vesState.isExportQueued = false;
    } else if (this.vesState.buildStatus.active) {
      this.vesState.isExportQueued = true;
    } else if (this.vesState.outputRomExists) {
      this.exportRom();
    } else {
      this.vesState.onDidChangeOutputRomExists(outputRomExists => {
        if (outputRomExists && this.vesState.isExportQueued) {
          this.vesState.isExportQueued = false;
          this.exportRom();
        }
      })
      this.vesState.isExportQueued = true;
      this.commandService.executeCommand(VesBuildCommands.BUILD.id);
    }
  }

  protected async exportRom() {
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
    const romStat = await this.fileService.resolve(romUri);
    do {
      selected = await this.fileDialogService.showSaveDialog(
        saveFilterDialogProps,
        romStat
      );
      if (selected) {
        exists = await this.fileService.exists(selected);
        if (exists) {
          overwrite = await this.confirmOverwrite(selected);
        }
      }
    } while (selected && exists && !overwrite);
    if (selected) {
      try {
        await this.commandService.executeCommand(CommonCommands.SAVE.id);
        await this.fileService.copy(romUri, selected, { overwrite });
      } catch (e) {
        console.warn(e);
      }
    }
  }

  protected async confirmOverwrite(uri: URI): Promise<boolean> {
    if (environment.electron.is()) {
      return true;
    }
    const confirmed = await new ConfirmDialog({
      title: "Overwrite",
      msg: `Do you really want to overwrite "${uri.toString()}"?`,
    }).open();
    return !!confirmed;
  }
}
