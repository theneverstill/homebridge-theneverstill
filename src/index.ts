/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-var-requires, max-statements, max-statements, no-extra-boolean-cast */
import type {
  AccessoryConfig,
  AccessoryPlugin,
  API,
  HAP,
  Logging,
  Service,
} from "homebridge";

import { createAccessoryInformationService } from "./service/accessory-information";
import { createSecuritySystemService } from "./service/security-system";
import { createSwitchService } from "./service/switch";

let hap: HAP;

const PLUGIN_IDENTIFIER: string = "homebridge-theneverstill";
const PLUGIN_ACCESSORY_NAME: string = "TheNeverStill";

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
  private readonly log: Logging;

  constructor(log: Logging, accessoryConfig: AccessoryConfig, api: API) {
    log.info(`Initializing accessory...`);

    this.accessoryConfig = accessoryConfig;
    this.log = log;

    if (!accessoryConfig.name) {
      log.error(`Accessory name is required`);
      this.cacheDirectory = "";
      this.storage = null;
      return;
    }

    const cacheDirectory = api.user.persistPath();

    const storage = require("node-persist");
    storage.initSync({
      dir: cacheDirectory,
      forgiveParseErrors: true,
    });

    this.cacheDirectory = cacheDirectory;
    this.storage = storage;
    this.services = TheNeverStillAccessory.createServices({
      accessoryConfig,
      log,
      storage,
    });

    log.info(`Finished initializing accessory.`);
  }

  private static createServices({
    accessoryConfig,
    log,
    storage,
  }: {
    accessoryConfig: AccessoryConfig;
    log: Logging;
    storage: any;
  }): Service[] {
    const services: Service[] = [];

    services.push(
      createAccessoryInformationService({
        accessoryConfig,
        hap,
      }),
    );

    services.push(
      ...TheNeverStillAccessory.createSecuritySystemServices({
        accessoryConfig,
        log,
        storage,
      }),
    );

    services.push(
      ...TheNeverStillAccessory.createSwitchServices({
        accessoryConfig,
        log,
        storage,
      }),
    );

    return services;
  }

  private static createSecuritySystemServices({
    accessoryConfig,
    log,
    storage,
  }: {
    accessoryConfig: AccessoryConfig;
    log: Logging;
    storage: any;
  }): Service[] {
    const services: Service[] = [];

    if (!!accessoryConfig?.securitySystemOneIsCreatable) {
      const securitySystemOneSwitchService = createSwitchService({
        config: {
          defaultState:
            accessoryConfig?.securitySystemOneSwitchDefaultState ?? false,
          defaultStateRevertTime:
            accessoryConfig?.securitySystemOneSwitchDefaultStateRevertTime ??
            -1,
          isDebugLoggingEnabled:
            accessoryConfig?.isDebugLoggingEnabled ?? false,
          isDefaultStateRevertTimeResettable:
            accessoryConfig?.securitySystemOneSwitchIsDefaultStateRevertTimeResettable ??
            false,
          name: accessoryConfig.name,
          subName: "securitySystemOneSwitch",
        },
        hap,
        log,
        storage,
      });

      services.push(
        securitySystemOneSwitchService,
        createSecuritySystemService({
          config: {
            isDebugLoggingEnabled:
              accessoryConfig?.isDebugLoggingEnabled ?? false,
            name: accessoryConfig.name,
            subName: "securitySystemOne",
          },
          hap,
          log,
          storage,
          switchService: securitySystemOneSwitchService,
        }),
      );
    }

    return services;
  }

  private static createSwitchServices({
    accessoryConfig,
    log,
    storage,
  }: {
    accessoryConfig: AccessoryConfig;
    log: Logging;
    storage: any;
  }): Service[] {
    const services: Service[] = [];

    if (!!accessoryConfig?.switchOneIsCreatable) {
      services.push(
        createSwitchService({
          config: {
            defaultState: accessoryConfig?.switchOneDefaultState ?? false,
            defaultStateRevertTime:
              accessoryConfig?.switchOneDefaultStateRevertTime ?? -1,
            isDebugLoggingEnabled:
              accessoryConfig?.isDebugLoggingEnabled ?? false,
            isDefaultStateRevertTimeResettable:
              accessoryConfig?.switchOneIsDefaultStateRevertTimeResettable ??
              false,
            name: accessoryConfig.name,
            subName: "switchOne",
          },
          hap,
          log,
          storage,
        }),
      );
    }

    if (!!accessoryConfig?.switchTwoIsCreatable) {
      services.push(
        createSwitchService({
          config: {
            defaultState: accessoryConfig?.switchTwoDefaultState ?? false,
            defaultStateRevertTime:
              accessoryConfig?.switchTwoDefaultStateRevertTime ?? -1,
            isDebugLoggingEnabled:
              accessoryConfig?.isDebugLoggingEnabled ?? false,
            isDefaultStateRevertTimeResettable:
              accessoryConfig?.switchTwoIsDefaultStateRevertTimeResettable ??
              false,
            name: accessoryConfig.name,
            subName: "switchTwo",
          },
          hap,
          log,
          storage,
        }),
      );
    }

    if (!!accessoryConfig?.switchThreeIsCreatable) {
      services.push(
        createSwitchService({
          config: {
            defaultState: accessoryConfig?.switchThreeDefaultState ?? false,
            defaultStateRevertTime:
              accessoryConfig?.switchThreeDefaultStateRevertTime ?? -1,
            isDebugLoggingEnabled:
              accessoryConfig?.isDebugLoggingEnabled ?? false,
            isDefaultStateRevertTimeResettable:
              accessoryConfig?.switchThreeIsDefaultStateRevertTimeResettable ??
              false,
            name: accessoryConfig.name,
            subName: "switchThree",
          },
          hap,
          log,
          storage,
        }),
      );
    }

    return services;
  }

  /*
   * This method is called directly after creation of this instance.
   * It should return all services which should be added to the accessory.
   */
  getServices(): Service[] {
    return this.services;
  }

  identify(): void {
    this.log("Identify");
  }
}
