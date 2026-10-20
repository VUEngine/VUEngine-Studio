// Search source folders outside the workspace, such as vuengine-core
export const VES_SOURCE_SEARCH_PATH = '/services/ves/source-search';
export const VesSourceSearch = Symbol('VesSourceSearch');

export interface VesSourceRoot {
  label: string;
  path: string;
}

export interface VesSourceMatch {
  file: string;
  line: number;
  text: string;
}

export interface VesSourceSearchResult {
  matches: VesSourceMatch[];
  total: number;
  files: number;
}

export interface VesSourceSearch {
  search(roots: VesSourceRoot[], pattern: string, ignoreCase: boolean, maxMatches: number): Promise<VesSourceSearchResult>;
}
