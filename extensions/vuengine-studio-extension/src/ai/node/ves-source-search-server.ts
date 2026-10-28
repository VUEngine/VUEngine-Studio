import { injectable } from '@theia/core/shared/inversify';
import { Dirent, promises as fs } from 'fs';
import path from 'path';
import { VesSourceMatch, VesSourceRoot, VesSourceSearch, VesSourceSearchResult } from '../common/ves-source-search-protocol';

const SKIPPED_FOLDERS = new Set(['.git', 'node_modules', 'build', '.DS_Store']);
const MAX_FILE_SIZE = 1024 * 1024;
const MAX_LINE = 240;

@injectable()
export class VesSourceSearchServer implements VesSourceSearch {

  async search(roots: VesSourceRoot[], pattern: string, ignoreCase: boolean, maxMatches: number): Promise<VesSourceSearchResult> {
    const expression = new RegExp(pattern, ignoreCase ? 'i' : '');
    const result: VesSourceSearchResult = { matches: [], total: 0, files: 0 };
    for (const root of roots) {
      const stat = await fs.stat(root.path).catch(() => undefined);
      if (stat?.isFile()) {
        await this.searchFile(root.path, root.label, expression, result, maxMatches);
      } else if (stat?.isDirectory()) {
        await this.searchFolder(root.path, root.label, expression, result, maxMatches);
      }
    }
    return result;
  }

  protected async searchFolder(folder: string, label: string, expression: RegExp, result: VesSourceSearchResult, maxMatches: number): Promise<void> {
    const entries: Dirent[] = await fs.readdir(folder, { withFileTypes: true }).catch(() => []);
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (SKIPPED_FOLDERS.has(entry.name)) {
        continue;
      }
      const full = path.join(folder, entry.name);
      const shown = `${label}/${entry.name}`;
      if (entry.isDirectory()) {
        await this.searchFolder(full, shown, expression, result, maxMatches);
      } else if (entry.isFile()) {
        await this.searchFile(full, shown, expression, result, maxMatches);
      }
    }
  }

  protected async searchFile(file: string, shown: string, expression: RegExp, result: VesSourceSearchResult, maxMatches: number): Promise<void> {
    const stat = await fs.stat(file).catch(() => undefined);
    if (!stat || stat.size > MAX_FILE_SIZE) {
      return;
    }
    const bytes = await fs.readFile(file).catch(() => undefined);
    // A NUL byte early on: not text.
    if (!bytes || bytes.subarray(0, 4096).includes(0)) {
      return;
    }
    result.files++;
    const lines = bytes.toString('utf8').split(/\r?\n/);
    lines.forEach((text, index) => {
      if (expression.test(text)) {
        result.total++;
        if (result.matches.length < maxMatches) {
          const match: VesSourceMatch = { file: shown, line: index + 1, text: text.trim().slice(0, MAX_LINE) };
          result.matches.push(match);
        }
      }
    });
  }
}
