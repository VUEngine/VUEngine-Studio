import { injectable, inject } from "inversify";
import { PreferenceService } from "@theia/core/lib/browser";
import { MessageService } from "@theia/core/lib/common";
import { join as joinPath } from "path";
import * as rimraf from "rimraf";
import { getBuildPath } from "../../common/common-functions";
import { VesState } from "../../common/ves-state";
import { VesBuildPrefs } from "../build-preferences";
import { BuildMode } from "../build-types";

@injectable()
export class VesBuildCleanCommand {
    @inject(MessageService) protected readonly messageService: MessageService;
    @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
    @inject(VesState) protected readonly vesState: VesState;

    async execute() {
        if (this.vesState.isCleaning) {
            return;
        }

        const buildMode = this.preferenceService.get(VesBuildPrefs.BUILD_MODE.id) as BuildMode;

        if (this.vesState.buildFolderExists[buildMode]) {
            this.clean(buildMode);
        } else {
            // messageService.info(`Build folder for ${buildMode} mode does not exist. Nothing to clean.`);
        }
    }

    protected async clean(buildMode: BuildMode) {
        const cleanPath = this.getCleanPath(buildMode);

        if (!this.vesState.buildFolderExists[buildMode]) {
            // messageService.info(`Build folder for ${buildMode} mode does not exist.`);
            return;
        }

        const progressMessage = await this.messageService.showProgress({
            text: `Cleaning build folder for ${buildMode} Mode...`
        });

        this.vesState.isCleaning = true;
        const vesState = this.vesState;
        rimraf(cleanPath, function (error) {
            progressMessage.cancel();
            vesState.isCleaning = false;
            vesState.setBuildFolderExists(buildMode, false);
            //messageService.info(`Build folder for ${buildMode} mode has been cleaned.`);
        });
    }

    protected getCleanPath(buildMode: BuildMode): string {
        return joinPath(getBuildPath(), buildMode);
    }
}