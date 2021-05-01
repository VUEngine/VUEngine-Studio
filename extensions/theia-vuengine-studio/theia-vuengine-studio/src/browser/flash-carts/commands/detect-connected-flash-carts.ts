import { injectable, inject } from "inversify";
import { VesState } from "../../common/ves-state";

@injectable()
export class VesFlashCartsDetectCommand {
  @inject(VesState) protected readonly vesState: VesState;

  async execute() {
    this.vesState.detectConnectedFlashCarts();
  }
}