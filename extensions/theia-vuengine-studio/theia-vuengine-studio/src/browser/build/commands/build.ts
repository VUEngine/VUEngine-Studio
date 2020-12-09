import { isWindows } from "@theia/core";
import { PreferenceService } from "@theia/core/lib/browser";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { TerminalWidgetOptions } from "@theia/terminal/lib/browser/base/terminal-widget";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { existsSync } from "fs";
import { join as joinPath } from "path";
import {
    convertoToEnvPath,
    getEngineCorePath,
    getEnginePluginsPath,
    getCompilerPath,
    getWorkspaceRoot,
    getThreads,
} from "../../common";

type BuildConfiguration = {
    type: string;
    dumpElf: boolean;
    pedanticWarnings: boolean;
}

export async function buildCommand(
    preferenceService: PreferenceService,
    terminalService: TerminalService,
    workspaceService: WorkspaceService
) {
    // TODO: get from config
    const buildConfiguration: BuildConfiguration = {
        type: "release",
        dumpElf: false,
        pedanticWarnings: false,
    };

    build(preferenceService, terminalService, workspaceService, buildConfiguration);
}

async function build(preferenceService: PreferenceService, terminalService: TerminalService, workspaceService: WorkspaceService, buildConfiguration: BuildConfiguration) {
    const engineCorePath = getEngineCorePath();
    const enginePluginsPath = getEnginePluginsPath();
    const compilerPath = getCompilerPath();
    const workingDir = convertoToEnvPath(preferenceService, getWorkspaceRoot(workspaceService));
    const v810path = convertoToEnvPath(preferenceService, joinPath(compilerPath, 'bin:$PATH'));
    const env = {
        'ENGINE_FOLDER': convertoToEnvPath(preferenceService, engineCorePath),
        'PLUGINS_FOLDER': convertoToEnvPath(preferenceService, enginePluginsPath),
        'MAKE_JOBS': getThreads() + '',
        'LC_ALL': 'C',
    };
    const preCallMake = 'export PATH=' + v810path + ' && ';
    const enableWsl = preferenceService.get("build.enableWsl");

    let makefile = convertoToEnvPath(preferenceService, joinPath(getWorkspaceRoot(workspaceService), 'makefile'));
    if (!existsSync(makefile)) {
        makefile = convertoToEnvPath(preferenceService, joinPath(engineCorePath, 'makefile-game'));
    }

    const exports = ['-e TYPE=' + buildConfiguration.type];
    if (buildConfiguration.dumpElf) {
        exports.push('DUMP_ELF=1');
    }
    if (buildConfiguration.pedanticWarnings) {
        exports.push('PRINT_PEDANTIC_WARNINGS=1');
    }

    if (isWindows && enableWsl) {
        exports.push('MAKE_JOBS=' + getThreads());
        exports.push('LC_ALL=C');
        exports.push('ENGINE_FOLDER=' + convertoToEnvPath(preferenceService, engineCorePath));
        exports.push('PLUGINS_FOLDER=' + convertoToEnvPath(preferenceService, enginePluginsPath));

        // fix line endings of preprocessor scripts
        // note: should no longer be necessary due to .gitattributes directive
        //preCallMake = 'find "' + convertoToEnvPath(engineCorePath) + 'lib/compiler/preprocessor/" -name "*.sh" -exec sed -i -e "s/$(printf \'\\r\')//" {} \\; && ' + preCallMake;
    }

    const terminalWidgetOptions: TerminalWidgetOptions = {
        title: "Build",
        env: env
    };
    const terminalWidget = await terminalService.newTerminal(terminalWidgetOptions);
    terminalWidget.start();
    terminalWidget.sendText(preCallMake + 'make all ' + exports.join(" ") + ' -f ' + makefile + ' -C ' + workingDir);
    console.log(preCallMake + 'make all ' + exports.join(" ") + ' -f ' + makefile + ' -C ' + workingDir);
    terminalService.open(terminalWidget);
}