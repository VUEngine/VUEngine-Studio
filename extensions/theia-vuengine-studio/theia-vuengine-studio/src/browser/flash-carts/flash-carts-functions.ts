import { join as joinPath } from "path";
import { isWindows } from "@theia/core";
import { PreferenceService } from "@theia/core/lib/browser";
import { getOs, getResourcesPath } from "../common/common-functions";
import { VesFlashCartsPrefs } from "./flash-carts-preferences";
import { FlashCartConfig } from "./flash-carts-types";
import { IMAGE_FLASHBOY_PLUS } from "./images/flashboy-plus";
import { IMAGE_HYPERFLASH32 } from "./images/hyperflash32";

export function getFlashCartConfigs(preferenceService: PreferenceService): FlashCartConfig[] {
    const flashCartConfigs: FlashCartConfig[] = preferenceService.get(VesFlashCartsPrefs.FLASH_CARTS.id) ?? [];

    const effectiveFlashCartConfigs = flashCartConfigs.length > 0
        ? flashCartConfigs
        : VesFlashCartsPrefs.FLASH_CARTS.property.default;

    return effectiveFlashCartConfigs.map((flashCartConfig: FlashCartConfig) => {
        return {
            ...flashCartConfig,
            path: flashCartConfig.path
                .replace("%HFCLI%", joinPath(
                    getResourcesPath(),
                    "binaries",
                    "vuengine-studio-tools",
                    getOs(),
                    "hf-cli",
                    isWindows ? "hfcli.exe" : "hfcli"
                ))
                .replace("%PROGVB%", joinPath(
                    getResourcesPath(),
                    "binaries",
                    "vuengine-studio-tools",
                    getOs(),
                    "prog-vb",
                    isWindows ? "prog-vb.exe" : "prog-vb"
                )),
            image: flashCartConfig.image
                .replace("%FBP_IMG%", IMAGE_FLASHBOY_PLUS)
                .replace("%HF32_IMG%", IMAGE_HYPERFLASH32),
        };
    });
}