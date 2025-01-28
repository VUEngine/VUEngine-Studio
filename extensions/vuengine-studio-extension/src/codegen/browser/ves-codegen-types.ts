export const CODEGEN_CHANNEL_NAME = 'Code Generator';
export const SHOW_DONE_DURATION = 10000;

export enum IsGeneratingFilesStatus {
  active = 0,
  done = 1,
  hide = 2,
}

export enum GenerationMode {
  All = 'all',
  ChangedOnly = 'changedOnly',
}
