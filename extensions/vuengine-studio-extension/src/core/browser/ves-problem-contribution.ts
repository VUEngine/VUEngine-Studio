import { FrontendApplication } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { ProblemContribution } from '@theia/markers/lib/browser/problem/problem-contribution';
import { WorkspaceService } from '@theia/workspace/lib/browser';

@injectable()
export class VesProblemContribution extends ProblemContribution {
  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  async onStart(app: FrontendApplication): Promise<void> {
    await this.workspaceService.ready;
    if (this.workspaceService.opened) {
      super.onStart(app);
    }
  }
}
