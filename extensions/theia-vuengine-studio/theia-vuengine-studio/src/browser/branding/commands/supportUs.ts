import { openUrl } from "../../common/functions";
import { VesUrls } from "../../common/urls";

export function supportUsCommand() {
  openUrl(VesUrls.PATREON);
}
