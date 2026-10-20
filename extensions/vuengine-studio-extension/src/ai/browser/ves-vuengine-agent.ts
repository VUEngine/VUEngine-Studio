import { AbstractStreamParsingChatAgent } from '@theia/ai-chat/lib/common/chat-agents';
import { CHANGE_SET_SUMMARY_VARIABLE_ID } from '@theia/ai-chat/lib/common/context-variables';
import { WRITE_FILE_CONTENT_ID, WRITE_FILE_REPLACEMENTS_ID } from '@theia/ai-ide/lib/common/file-changeset-function-ids';
import {
  FILE_CONTENT_FUNCTION_ID, FIND_FILES_BY_PATTERN_FUNCTION_ID, GET_FILE_DIAGNOSTICS_ID,
  GET_WORKSPACE_FILE_LIST_FUNCTION_ID, SEARCH_IN_WORKSPACE_FUNCTION_ID,
} from '@theia/ai-ide/lib/common/workspace-functions';
import { injectable } from '@theia/core/shared/inversify';
import { VUENGINE_AGENT_GUIDE } from '../common/ves-agent-guide';
import { VesBuildAgentTool } from '../../build/browser/ves-build-agent-tool';
import { VesEmulatorAgentTool } from '../../emulator/browser/ves-emulator-agent-tool';
import { VesProjectAgentTool } from '../../project/browser/ves-project-agent-tool';
import { VesEngineAgentTool } from './ves-engine-agent-tool';

export const VUENGINE_AGENT_ID = 'VUEngine';
export const VUENGINE_SYSTEM_PROMPT_ID = 'vuengine-system';

@injectable()
export class VesVuengineAgent extends AbstractStreamParsingChatAgent {

  override id = VUENGINE_AGENT_ID;
  override name = VUENGINE_AGENT_ID;
  override description = 'Develops Virtual Boy games with VUEngine: reads and changes the code and the data items, '
    + 'builds, and checks the result in the emulator — with the engine\'s source at hand.';
  override iconClass = 'codicon codicon-device-camera-video';
  override languageModelRequirements = [{ purpose: 'chat', identifier: 'default/code' }];
  protected override defaultLanguageModelPurpose = 'chat';
  override prompts = [{
    id: VUENGINE_SYSTEM_PROMPT_ID,
    defaultVariant: {
      id: VUENGINE_SYSTEM_PROMPT_ID,
      template: `${VUENGINE_AGENT_GUIDE}

## Tools at hand
- VUEngine Studio: ~{${VesEngineAgentTool.NAME}} ~{${VesProjectAgentTool.NAME}} ~{${VesBuildAgentTool.NAME}} ~{${VesEmulatorAgentTool.NAME}}
- The workspace: ~{${GET_WORKSPACE_FILE_LIST_FUNCTION_ID}} ~{${FIND_FILES_BY_PATTERN_FUNCTION_ID}} ~{${SEARCH_IN_WORKSPACE_FUNCTION_ID}}
  ~{${FILE_CONTENT_FUNCTION_ID}} ~{${GET_FILE_DIAGNOSTICS_ID}}
- Changing files: ~{${WRITE_FILE_REPLACEMENTS_ID}} for edits, ~{${WRITE_FILE_CONTENT_ID}} for new files.

{{${CHANGE_SET_SUMMARY_VARIABLE_ID}}}`,
    },
    variants: [],
  }];
  protected override systemPromptId = VUENGINE_SYSTEM_PROMPT_ID;
}
