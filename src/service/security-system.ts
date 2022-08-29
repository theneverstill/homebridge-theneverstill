/* eslint-disable @typescript-eslint/no-explicit-any, max-lines, max-statements, no-extra-boolean-cast */
import type {
  CharacteristicChange,
  CharacteristicValue,
  HAP,
  Logging,
} from "homebridge";

import type { SecuritySystem, Switch } from "hap-nodejs/dist/lib/definitions";

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
import { CharacteristicEventTypes } from "homebridge";

export function createSecuritySystemService({
  config,
  hap,
  log,
  storage,
  switchService,
}: {
  config: {
    isDebugLoggingEnabled: boolean;
    name: string;
    retriggerTime: number;
    subName: string;
  };
  hap: HAP;
  log: Logging;
  storage: any;
  switchService: Switch;
}): SecuritySystem {
  // If enabled, enforce a minimum of 1 second
  if (config.retriggerTime >= 0 && config.retriggerTime < 1000) {
    config.retriggerTime = 1000;
  }

  const securitySystemService = new hap.Service.SecuritySystem(
    config.name,
    config.subName,
  );

  let timeout: NodeJS.Timeout | null = null;

  const storageIdCurrentState = `${config.name}.${config.subName}.currentState`;
  const storageIdTargetState = `${config.name}.${config.subName}.targetState`;

  let currentState: number =
    hap.Characteristic.SecuritySystemCurrentState.STAY_ARM;
  let targetState: number =
    hap.Characteristic.SecuritySystemTargetState.STAY_ARM;

  // Set or reset current state (if applicable) on Homebridge start
  const cachedCurrentState: number = storage.getItemSync(storageIdCurrentState);
  currentState = [
    hap.Characteristic.SecuritySystemCurrentState.STAY_ARM,
    hap.Characteristic.SecuritySystemCurrentState.AWAY_ARM,
    hap.Characteristic.SecuritySystemCurrentState.NIGHT_ARM,
    hap.Characteristic.SecuritySystemCurrentState.DISARMED,
    hap.Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED,
  ].includes(cachedCurrentState)
    ? cachedCurrentState
    : currentState;
  securitySystemService.setCharacteristic(
    hap.Characteristic.SecuritySystemCurrentState,
    currentState,
  );

  // Set or reset target state (if applicable) on Homebridge start
  const cachedTargetState: number = storage.getItemSync(storageIdTargetState);
  targetState = [
    hap.Characteristic.SecuritySystemTargetState.STAY_ARM,
    hap.Characteristic.SecuritySystemTargetState.AWAY_ARM,
    hap.Characteristic.SecuritySystemTargetState.NIGHT_ARM,
    hap.Characteristic.SecuritySystemTargetState.DISARM,
  ].includes(cachedTargetState)
    ? cachedTargetState
    : targetState;
  securitySystemService.setCharacteristic(
    hap.Characteristic.SecuritySystemTargetState,
    targetState,
  );

  securitySystemService
    .getCharacteristic(hap.Characteristic.SecuritySystemCurrentState)
    .onGet((): CharacteristicValue => {
      if (config.isDebugLoggingEnabled) {
        log.info(
          `[${
            config.subName
          }][debug] Get current state: ${convertSecuritySystemCurrentStateToString(
            { hap, log, state: currentState },
          )}`,
        );
      }

      return currentState;
    });

  securitySystemService
    .getCharacteristic(hap.Characteristic.SecuritySystemTargetState)
    .setProps({
      validValues: [
        hap.Characteristic.SecuritySystemTargetState.STAY_ARM,
        hap.Characteristic.SecuritySystemTargetState.DISARM,
      ],
    })
    .onGet((): CharacteristicValue => {
      if (config.isDebugLoggingEnabled) {
        log.info(
          `[${
            config.subName
          }][debug] Get target state: ${convertSecuritySystemTargetStateToString(
            { hap, log, state: targetState },
          )}`,
        );
      }

      return targetState;
    })
    .onSet((value: CharacteristicValue): CharacteristicValue => {
      targetState = value as number;

      if (config.isDebugLoggingEnabled) {
        log.info(
          `[${
            config.subName
          }][debug] Set target state: ${convertSecuritySystemTargetStateToString(
            {
              hap,
              log,
              state: targetState,
            },
          )}`,
        );
      }

      const newCurrentState = determineNewCurrentState({
        currentState,
        hap,
        onCharacteristic: switchService.getCharacteristic(hap.Characteristic.On)
          .value as boolean,
        targetState,
      });

      if (currentState !== newCurrentState) {
        currentState = newCurrentState;

        securitySystemService.setCharacteristic(
          hap.Characteristic.SecuritySystemCurrentState,
          currentState,
        );

        storage.setItemSync(storageIdCurrentState, currentState);
      }

      storage.setItemSync(storageIdTargetState, targetState);

      return value;
    });

  switchService
    .getCharacteristic(hap.Characteristic.On)
    .on(
      CharacteristicEventTypes.CHANGE,
      (change: CharacteristicChange): void => {
        const onCharacteristic = change.newValue as boolean;

        if (
          onCharacteristic &&
          targetState === hap.Characteristic.SecuritySystemTargetState.DISARM
        ) {
          if (config.isDebugLoggingEnabled) {
            log.info(
              `[${
                config.subName
              }][debug] Trying to turn on switch when current state is: ${convertSecuritySystemCurrentStateToString(
                { hap, log, state: currentState },
              )}`,
            );
          }

          switchService.setCharacteristic(hap.Characteristic.On, false);

          if (!!timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          return;
        }

        const newCurrentState = determineNewCurrentState({
          currentState,
          hap,
          onCharacteristic,
          targetState,
        });

        if (currentState !== newCurrentState) {
          currentState = newCurrentState;

          if (config.isDebugLoggingEnabled) {
            log.info(
              `[${
                config.subName
              }][debug] Set current state: ${convertSecuritySystemCurrentStateToString(
                { hap, log, state: currentState },
              )}`,
            );
          }

          securitySystemService.setCharacteristic(
            hap.Characteristic.SecuritySystemCurrentState,
            currentState,
          );

          storage.setItemSync(storageIdCurrentState, currentState);
        }

        if (
          !timeout &&
          currentState ===
            hap.Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED &&
          config.retriggerTime >= 0
        ) {
          timeout = setTimeout(retriggerSwitchService, config.retriggerTime, {
            config,
            log,
            hap,
            switchService,
          });
        } else if (!!timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
      },
    );

  // Reset timeout (if applicable) on Homebridge start
  if (
    !timeout &&
    (switchService.getCharacteristic(hap.Characteristic.On).value as boolean) &&
    currentState ===
      hap.Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED &&
    config.retriggerTime >= 0
  ) {
    timeout = setTimeout(retriggerSwitchService, config.retriggerTime, {
      config,
      log,
      hap,
      switchService,
    });
  }

  return securitySystemService;
}

function determineNewCurrentState({
  currentState,
  hap,
  onCharacteristic,
  targetState,
}: {
  currentState: number;
  hap: HAP;
  onCharacteristic: boolean;
  targetState: number;
}): number {
  let newCurrentState = currentState;

  if (targetState === hap.Characteristic.SecuritySystemTargetState.DISARM) {
    newCurrentState = hap.Characteristic.SecuritySystemCurrentState.DISARMED;
  } else if (
    onCharacteristic &&
    targetState === hap.Characteristic.SecuritySystemTargetState.STAY_ARM
  ) {
    newCurrentState =
      hap.Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED;
  } else if (
    !onCharacteristic &&
    targetState === hap.Characteristic.SecuritySystemTargetState.STAY_ARM
  ) {
    newCurrentState = hap.Characteristic.SecuritySystemCurrentState.STAY_ARM;
  }

  return newCurrentState;
}

function retriggerSwitchService({
  config,
  log,
  hap,
  switchService,
}: {
  config: {
    isDebugLoggingEnabled: boolean;
    subName: string;
  };
  log: Logging;
  hap: HAP;
  switchService: Switch;
}): void {
  if (config.isDebugLoggingEnabled) {
    log.info(`[${config.subName}][debug] Retriggering...`);
  }
  switchService.setCharacteristic(hap.Characteristic.On, false);
  setTimeout((): void => {
    switchService.setCharacteristic(hap.Characteristic.On, true);
  }, 1000);
}

function convertSecuritySystemCurrentStateToString({
  hap,
  log,
  state,
}: {
  hap: HAP;
  log: Logging;
  state: number;
}): string {
  switch (state) {
    case hap.Characteristic.SecuritySystemCurrentState.STAY_ARM: {
      return "STAY_ARM";
    }
    case hap.Characteristic.SecuritySystemCurrentState.AWAY_ARM: {
      return "AWAY_ARM";
    }
    case hap.Characteristic.SecuritySystemCurrentState.NIGHT_ARM: {
      return "NIGHT_ARM";
    }
    case hap.Characteristic.SecuritySystemCurrentState.DISARMED: {
      return "DISARMED";
    }
    case hap.Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED: {
      return "ALARM_TRIGGERED";
    }
    default: {
      log.error(`Unexpected SecuritySystemCurrentState: ${state}`);
      return "";
    }
  }
}

function convertSecuritySystemTargetStateToString({
  hap,
  log,
  state,
}: {
  hap: HAP;
  log: Logging;
  state: number;
}): string {
  switch (state) {
    case hap.Characteristic.SecuritySystemTargetState.STAY_ARM: {
      return "STAY_ARM";
    }
    case hap.Characteristic.SecuritySystemTargetState.AWAY_ARM: {
      return "AWAY_ARM";
    }
    case hap.Characteristic.SecuritySystemTargetState.NIGHT_ARM: {
      return "NIGHT_ARM";
    }
    case hap.Characteristic.SecuritySystemTargetState.DISARM: {
      return "DISARM";
    }
    default: {
      log.error(`Unexpected SecuritySystemTargetState: ${state}`);
      return "";
    }
  }
}
