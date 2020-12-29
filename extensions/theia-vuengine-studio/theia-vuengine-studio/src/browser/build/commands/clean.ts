import { PreferenceService } from "@theia/core/lib/browser";
import { MessageService } from "@theia/core/lib/common";
import { QuickPickService } from "@theia/core/lib/common/quick-pick-service";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { join as joinPath } from "path";
import * as rimraf from "rimraf";
import { getBuildPath } from "../../common";
import { VesStateModel } from "../../common/vesStateModel";
import { VesBuildModePreference } from "../preferences";
import { BuildMode } from "../types";

export async function cleanCommand(
    fileService: FileService,
    messageService: MessageService,
    preferenceService: PreferenceService,
    quickPickService: QuickPickService,
    vesState: VesStateModel
) {
    if (vesState.isCleaning) {
        return;
    }

    // const quickPickOptions: QuickPickOptions = {
    //     title: "Clean build folder",
    //     placeholder: "Which build mode do you want to remove processed files for?",
    // };
    // const quickPickItems: QuickPickItem<string>[] = [];

    // const buildModes = [
    //     {
    //         label: "All",
    //         value: "all"
    //     },
    //     {
    //         label: "Release",
    //         value: "release"
    //     },
    //     {
    //         label: "Beta",
    //         value: "beta"
    //     },
    //     {
    //         label: "Tools",
    //         value: "tools"
    //     },
    //     {
    //         label: "Debug",
    //         value: "debug"
    //     },
    //     {
    //         label: "Preprocessor",
    //         value: "preprocessor"
    //     }
    // ];

    // for (const buildMode of buildModes) {
    //     if (vesState.buildFolderExists[buildMode.value]) {
    //         quickPickItems.push(buildMode);
    //     }
    // }

    // if (quickPickItems.length === 0) {
    //     messageService.info("Build folder does not exist. Nothing to clean.");
    //     return;
    // }

    // quickPickService.show<string>(quickPickItems, quickPickOptions).then(selection => {
    //     if (!selection) {
    //         return;
    //     }

    //     clean(fileService, messageService, vesState, selection);
    // });

    const buildMode = preferenceService.get(VesBuildModePreference.id) as BuildMode;

    if (vesState.buildFolderExists[buildMode]) {
        clean(fileService, messageService, vesState, buildMode);
    } else {
        // messageService.info(`Build folder for ${buildMode} mode does not exist. Nothing to clean.`);
    }
}

async function clean(
    fileService: FileService,
    messageService: MessageService,
    vesState: VesStateModel,
    buildMode: string
) {
    const clearAll = (buildMode === "all");
    const cleanPath = getCleanPath(buildMode);

    vesState.isCleaning = true;

    if (!vesState.buildFolderExists[buildMode]) {
        // const notFoundMessage = clearAll
        //     ? `Build folder does not exist.`
        //     : `Build folder for ${mode} mode does not exist.`;
        // messageService.info(notFoundMessage);
        return;
    }

    const inProgressMessage = clearAll
        ? `Cleaning build folder...`
        : `Cleaning build folder for ${buildMode} mode...`;

    // const doneMessage = clearAll
    //     ? `Build folder has been cleaned.`
    //     : `Build folder for ${mode} mode has been cleaned.`;

    const progressMessage = await messageService.showProgress({
        text: inProgressMessage
    });

    rimraf(cleanPath, function (error) {
        progressMessage.cancel();
        //messageService.info(doneMessage);
        vesState.isCleaning = false;
    });
}

function getCleanPath(buildMode: string): string {
    const clearAll = (buildMode === "all");
    let cleanPath = getBuildPath();
    if (!clearAll) {
        cleanPath = joinPath(cleanPath, buildMode);
    }

    return cleanPath;
}