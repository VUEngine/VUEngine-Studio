import { CommandService } from "@theia/core/lib/common";
// import theiaURI from '@theia/core/lib/common/uri';

export function supportUsCommand(commandService: CommandService) {
  // const uri = new theiaURI("https://www.patreon.com/VUEngine");
  // commandService.executeCommand("theia.open", uri);
  commandService.executeCommand("vscode.open", "https://www.patreon.com/VUEngine");
  alert("https://www.patreon.com/VUEngine");
}
