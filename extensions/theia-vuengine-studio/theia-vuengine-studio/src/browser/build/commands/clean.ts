import { MessageService } from "@theia/core/lib/common";
import { QuickPickItem, QuickPickOptions, QuickPickService } from "@theia/core/lib/common/quick-pick-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { existsSync } from "fs";
import { join as joinPath } from "path";
import rimraf = require("rimraf");
import {
    getWorkspaceRoot,
} from "../../common";
import { VesStateModel } from "../../common/vesStateModel";


export async function cleanCommand(
    messageService: MessageService,
    quickPickService: QuickPickService,
    vesState: VesStateModel,
    workspaceService: WorkspaceService
) {
    if (vesState.isCleaning) {
        return;
    }

    const quickPickOptions: QuickPickOptions = {
        title: "Clean build folder",
        placeholder: "Which build type do you want to remove processed files for?",
    };
    const quickPickItems: QuickPickItem<string>[] = [];

    const buildTypes = [
        {
            label: "All",
            value: "all"
        },
        {
            label: "Release",
            value: "release"
        },
        {
            label: "Beta",
            value: "beta"
        },
        {
            label: "Tools",
            value: "tools"
        },
        {
            label: "Debug",
            value: "debug"
        },
        {
            label: "Preprocessor",
            value: "preprocessor"
        }
    ];

    for (const buildType of buildTypes) {
        const cleanPath = getCleanPath(workspaceService, buildType.value);
        if (existsSync(cleanPath)) {
            quickPickItems.push(buildType);
        }
    }

    if (quickPickItems.length === 0) {
        messageService.info("Build folder does not exist. Nothing to clean.");
        return;
    }

    quickPickService.show<string>(quickPickItems, quickPickOptions).then(selection => {
        if (!selection) {
            return;
        }

        clean(messageService, vesState, workspaceService, selection);
    });
}

async function clean(
    messageService: MessageService,
    vesState: VesStateModel,
    workspaceService: WorkspaceService,
    type: string
) {
    const clearAll = (type === "all");
    const cleanPath = getCleanPath(workspaceService, type);

    vesState.isCleaning = true;

    if (!existsSync(cleanPath)) {
        const notFoundMessage = clearAll
            ? `Build folder does not exist.`
            : `Build folder for type "${type}" does not exist.`;
        messageService.info(notFoundMessage);
        return;
    }

    const inProgressMessage = clearAll
        ? `Cleaning build folder...`
        : `Cleaning build folder for type "${type}"...`;

    const doneMessage = clearAll
        ? `Build folder has been cleaned.`
        : `Build folder for type "${type}" has been cleaned.`;

    const progressMessage = await messageService.showProgress({
        text: inProgressMessage
    });

    rimraf(cleanPath, function (error) {
        progressMessage.cancel();
        messageService.info(doneMessage);
        vesState.isCleaning = false;
    });
}

function getCleanPath(workspaceService: WorkspaceService, type: string): string {
    const clearAll = (type === "all");
    let cleanPath = joinPath(getWorkspaceRoot(workspaceService), 'build');
    if (!clearAll) {
        cleanPath = joinPath(cleanPath, type);
    }

    return cleanPath;
}