import { PreferenceService } from "@theia/core/lib/browser";
import { MessageService } from "@theia/core/lib/common";
import { join as joinPath } from "path";
import * as rimraf from "rimraf";
import { getBuildPath } from "../../common/functions";
import { VesStateModel } from "../../common/vesStateModel";
import { VesBuildModePreference } from "../preferences";
import { BuildMode } from "../types";

export async function cleanCommand(
    messageService: MessageService,
    preferenceService: PreferenceService,
    vesState: VesStateModel
) {
    if (vesState.isCleaning) {
        return;
    }

    const buildMode = preferenceService.get(VesBuildModePreference.id) as BuildMode;

    if (vesState.buildFolderExists[buildMode]) {
        clean(messageService, vesState, buildMode);
    } else {
        // messageService.info(`Build folder for ${buildMode} mode does not exist. Nothing to clean.`);
    }
}

async function clean(
    messageService: MessageService,
    vesState: VesStateModel,
    buildMode: BuildMode
) {
    const cleanPath = getCleanPath(buildMode);

    if (!vesState.buildFolderExists[buildMode]) {
        // messageService.info(`Build folder for ${buildMode} mode does not exist.`);
        return;
    }

    const progressMessage = await messageService.showProgress({
        text: `Cleaning build folder for ${buildMode} Mode...`
    });

    vesState.isCleaning = true;
    rimraf(cleanPath, function (error) {
        progressMessage.cancel();
        vesState.isCleaning = false;
        vesState.setBuildFolderExists(buildMode, false);
        //messageService.info(`Build folder for ${buildMode} mode has been cleaned.`);
    });
}

function getCleanPath(buildMode: BuildMode): string {
    return joinPath(getBuildPath(), buildMode);
}