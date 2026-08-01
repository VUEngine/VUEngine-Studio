export const CODEGEN_CHANNEL_NAME = 'Code Generator';
export const SHOW_DONE_DURATION = 10000;
// Time window in which repeated change events for one file collapse into a single run.
export const FILE_UPDATE_DEBOUNCE = 500;
/**
 * Upper bound for generating a single file, so that a stuck step cannot hang generation
 * indefinitely. Generous on purpose: image and PCM conversion legitimately take minutes
 * on large assets, so this is a last resort against hangs, not a performance budget.
 */
export const RENDER_TIMEOUT = 300000;

export enum IsGeneratingFilesStatus {
  active = 0,
  done = 1,
  hide = 2,
  error = 3,
}

export interface GenerationResult {
  generated: number;
  failed: number;
}

export enum GenerationMode {
  All = 'all',
  ChangedOnly = 'changedOnly',
}
