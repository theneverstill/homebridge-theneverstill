/* eslint-disable @typescript-eslint/no-explicit-any, max-statements, max-statements, no-extra-boolean-cast */
import type {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  CharacteristicGetCallback,
  CharacteristicSetCallback,
  CharacteristicValue,
  HAP,
  Logging,
  Service,
} from "homebridge";

import type {
  AccessoryInformation,
  Switch,
} from "hap-nodejs/dist/lib/definitions";

/*
 * IMPORTANT NOTICE
 *
 * One thing you need to take care of is, that you never ever ever import anything directly from the "homebridge" module (or the "hap-nodejs" module).
 * The below import block may seem like, that we do exactly that, but actually those imports are only used for CONST ENUMS,
 * which is a special case as they get replaced by the actual value and do not remain as a reference in the compiled code.
 * Meaning normal enums are bad, const enums can be used.
 *
 * You MUST NOT import anything else which remains as a reference in the code, as this will result in
 * a `... = require("homebridge");` to be compiled into the final Javascript code.
 * This typically leads to unexpected behavior at runtime, as in many cases it won't be able to find the module
 * or will import another instance of homebridge causing collisions.
 *
 * To mitigate this the {@link API | Homebridge API} exposes the whole suite of HAP-NodeJS inside the `hap` property
 * of the api object, which can be acquired for example in the initializer function. This reference can be stored
 * like this for example and used to access all exported variables and classes from HAP-NodeJS.
 */
import { CharacteristicEventTypes, HAPStatus } from "homebridge";

interface SwitchServiceConfig {
  defaultState: boolean;
  defaultStateRevertTime: number;
  isDebugLoggingEnabled: boolean;
  isDefaultStateRevertTimeResettable: boolean;
  name: string;
  subName: string;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("../package.json");

let hap: HAP;

const PLUGIN_IDENTIFIER: string = "homebridge-theneverstill";
const PLUGIN_ACCESSORY_NAME: string = "TheNeverStill";
const PLUGIN_ACCESSORY_INFORMATION_MANUFACTURER: string =
  "Homebridge Plugin TheNeverStill";
const PLUGIN_ACCESSORY_INFORMATION_MODEL: string = "Accessory";

export = (api: API) => {
  hap = api.hap;
  api.registerAccessory(
    PLUGIN_IDENTIFIER,
    PLUGIN_ACCESSORY_NAME,
    TheNeverStillAccessory,
  );
};

class TheNeverStillAccessory implements AccessoryPlugin {
  private readonly accessoryConfig: AccessoryConfig;
  private readonly services: Service[] = [];

  private readonly cacheDirectory: string;
  private readonly storage: any;

  constructor(log: Logging, accessoryConfig: AccessoryConfig, api: API) {
    log.info(`Initializing accessory...`);

    this.accessoryConfig = accessoryConfig;

    this.cacheDirectory = api.user.persistPath();

    this.storage = require("node-persist");
    this.storage.initSync({
      dir: this.cacheDirectory,
      forgiveParseErrors: true,
    });

    this.services.push(
      TheNeverStillAccessory.createAccessoryInformationService({
        accessoryConfig,
      }),
    );

    if (!!accessoryConfig.switchOneIsCreatable) {
      this.services.push(
        TheNeverStillAccessory.createSwitchService({
          config: {
            defaultState: accessoryConfig.switchOneDefaultState ?? false,
            defaultStateRevertTime:
              accessoryConfig.switchOneDefaultStateRevertTime ?? -1,
            isDebugLoggingEnabled:
              accessoryConfig.isDebugLoggingEnabled ?? false,
            isDefaultStateRevertTimeResettable:
              accessoryConfig.switchOneIsDefaultStateRevertTimeResettable ??
              false,
            name: accessoryConfig.name,
            subName: "switchOne",
          },
          log,
          storage: this.storage,
        }),
      );
    }

    if (!!accessoryConfig.switchTwoIsCreatable) {
      this.services.push(
        TheNeverStillAccessory.createSwitchService({
          config: {
            defaultState: accessoryConfig.switchTwoDefaultState ?? false,
            defaultStateRevertTime:
              accessoryConfig.switchTwoDefaultStateRevertTime ?? -1,
            isDebugLoggingEnabled:
              accessoryConfig.isDebugLoggingEnabled ?? false,
            isDefaultStateRevertTimeResettable:
              accessoryConfig.switchTwoIsDefaultStateRevertTimeResettable ??
              false,
            name: accessoryConfig.name,
            subName: "switchTwo",
          },
          log,
          storage: this.storage,
        }),
      );
    }

    if (!!accessoryConfig.switchThreeIsCreatable) {
      this.services.push(
        TheNeverStillAccessory.createSwitchService({
          config: {
            defaultState: accessoryConfig.switchThreeDefaultState ?? false,
            defaultStateRevertTime:
              accessoryConfig.switchThreeDefaultStateRevertTime ?? -1,
            isDebugLoggingEnabled:
              accessoryConfig.isDebugLoggingEnabled ?? false,
            isDefaultStateRevertTimeResettable:
              accessoryConfig.switchThreeIsDefaultStateRevertTimeResettable ??
              false,
            name: accessoryConfig.name,
            subName: "switchThree",
          },
          log,
          storage: this.storage,
        }),
      );
    }

    log.info(`Finished initializing accessory.`);
  }

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    return this.services;
  }

  private static createAccessoryInformationService({
    accessoryConfig,
  }: {
    accessoryConfig: AccessoryConfig;
  }): AccessoryInformation {
    return new hap.Service.AccessoryInformation()
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
  }

  private static createSwitchService({
    config,
    log,
    storage,
  }: {
    config: SwitchServiceConfig;
    log: Logging;
    storage: any;
  }): Switch {
    const switchService = new hap.Service.Switch(config.name, config.subName);

    const storageIdCurrentState = `${config.name}.${config.subName}.currentState`;

    let currentState: boolean = config.defaultState;
    let timeout: NodeJS.Timeout | null = null;

    // Set or reset current state (if applicable) on Homebridge start
    const cachedState: boolean = storage.getItemSync(storageIdCurrentState);
    if (cachedState === true || cachedState === false) {
      currentState = cachedState;
    }
    switchService.setCharacteristic(hap.Characteristic.On, currentState);

    switchService
      .getCharacteristic(hap.Characteristic.On)
      .on(
        CharacteristicEventTypes.GET,
        (callback: CharacteristicGetCallback) => {
          if (config.isDebugLoggingEnabled) {
            log.info(
              `[${config.subName}][debug] Get current state: ${
                currentState ? "ON" : "OFF"
              }`,
            );
          }

          callback(HAPStatus.SUCCESS, currentState);
        },
      )
      .on(
        CharacteristicEventTypes.SET,
        (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
          currentState = value as boolean;

          log.debug(
            `[${config.subName}][debug] Set current state: ${
              currentState ? "ON" : "OFF"
            }`,
          );

          if (currentState !== config.defaultState) {
            if (config.isDefaultStateRevertTimeResettable && !!timeout) {
              // Clear existing timeout if it is resettable
              clearTimeout(timeout);
              timeout = null;
            }

            if (!timeout && config.defaultStateRevertTime >= 0) {
              // Set a timeout only if one doesn't already exist and defaultStateRevertTime isn't -1
              timeout = setTimeout(() => {
                switchService.setCharacteristic(
                  hap.Characteristic.On,
                  config.defaultState,
                );
              }, config.defaultStateRevertTime);
            }
          } else if (!!timeout) {
            // Clear timeout if it exists since current state matches default state
            clearTimeout(timeout);
            timeout = null;
          }

          storage.setItemSync(storageIdCurrentState, currentState);

          callback(HAPStatus.SUCCESS);
        },
      );

    if (
      !timeout &&
      currentState !== config.defaultState &&
      config.defaultStateRevertTime >= 0
    ) {
      // Reset timers (if applicable) on Homebridge start
      timeout = setTimeout(() => {
        switchService.setCharacteristic(
          hap.Characteristic.On,
          config.defaultState,
        );
      }, config.defaultStateRevertTime);
    }

    return switchService;
  }
}
