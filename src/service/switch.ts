/* eslint-disable @typescript-eslint/no-explicit-any, max-statements, no-extra-boolean-cast */
import type { CharacteristicValue, HAP, Logging } from "homebridge";

import type { Switch } from "hap-nodejs/dist/lib/definitions";

export function createSwitchService({
  config,
  hap,
  log,
  storage,
}: {
  config: {
    defaultState: boolean;
    defaultStateRevertTime: number;
    isDebugLoggingEnabled: boolean;
    isDefaultStateRevertTimeResettable: boolean;
    name: string;
    subName: string;
  };
  hap: HAP;
  log: Logging;
  storage: any;
}): Switch {
  const switchService = new hap.Service.Switch(config.name, config.subName);

  const storageIdOnCharacteristic = `${config.name}.${config.subName}.onCharacteristic`;

  let onCharacteristic: boolean = config.defaultState;
  let timeout: NodeJS.Timeout | null = null;

  // Set or reset on characteristic (if applicable) on Homebridge start
  const cachedOnCharacteristic: boolean = storage.getItemSync(
    storageIdOnCharacteristic,
  );
  onCharacteristic =
    cachedOnCharacteristic === true || cachedOnCharacteristic === false
      ? cachedOnCharacteristic
      : onCharacteristic;
  switchService.setCharacteristic(hap.Characteristic.On, onCharacteristic);

  switchService
    .getCharacteristic(hap.Characteristic.On)
    .onGet((): CharacteristicValue => {
      if (config.isDebugLoggingEnabled) {
        log.info(
          `[${config.subName}][debug] Get on characteristic: ${
            onCharacteristic ? "ON" : "OFF"
          }`,
        );
      }

      return onCharacteristic;
    })
    .onSet((value: CharacteristicValue): void => {
      onCharacteristic = value as boolean;

      if (config.isDebugLoggingEnabled) {
        log.info(
          `[${config.subName}][debug] Set on characteristic: ${
            onCharacteristic ? "ON" : "OFF"
          }`,
        );
      }

      if (onCharacteristic !== config.defaultState) {
        if (config.isDefaultStateRevertTimeResettable && !!timeout) {
          clearTimeout(timeout);
          timeout = null;
        }

        if (!timeout && config.defaultStateRevertTime >= 0) {
          timeout = setTimeout(() => {
            switchService.setCharacteristic(
              hap.Characteristic.On,
              config.defaultState,
            );
          }, config.defaultStateRevertTime);
        }
      } else if (!!timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      storage.setItemSync(storageIdOnCharacteristic, onCharacteristic);
    });

  // Reset timers (if applicable) on Homebridge start
  if (
    !timeout &&
    onCharacteristic !== config.defaultState &&
    config.defaultStateRevertTime >= 0
  ) {
    timeout = setTimeout(() => {
      switchService.setCharacteristic(
        hap.Characteristic.On,
        config.defaultState,
      );
    }, config.defaultStateRevertTime);
  }

  return switchService;
}
