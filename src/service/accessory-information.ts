/* eslint-disable @typescript-eslint/no-explicit-any, max-statements, no-extra-boolean-cast */
import type { AccessoryConfig, HAP } from "homebridge";

import type { AccessoryInformation } from "hap-nodejs/dist/lib/definitions";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../../package.json");

const PLUGIN_ACCESSORY_INFORMATION_MANUFACTURER: string = "Homebridge";
const PLUGIN_ACCESSORY_INFORMATION_MODEL: string = "TheNeverStill";

export const createAccessoryInformationService = ({
  accessoryConfig,
  hap,
}: {
  accessoryConfig: AccessoryConfig;
  hap: HAP;
}): AccessoryInformation =>
  new hap.Service.AccessoryInformation()
    .setCharacteristic(hap.Characteristic.Identify, true)
    .setCharacteristic(
      hap.Characteristic.Manufacturer,
      PLUGIN_ACCESSORY_INFORMATION_MANUFACTURER,
    )
    .setCharacteristic(
      hap.Characteristic.Model,
      PLUGIN_ACCESSORY_INFORMATION_MODEL,
    )
    .setCharacteristic(
      hap.Characteristic.SerialNumber,
      hap.uuid.generate(
        PLUGIN_ACCESSORY_INFORMATION_MANUFACTURER + accessoryConfig.uuid,
      ),
    )
    .setCharacteristic(hap.Characteristic.FirmwareRevision, version);
