<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

# Homebridge Plugin TheNeverStill

Homebridge plugin to add critical functionality to your HomeKit home.

## Frequently Asked Questions (FAQ)

**What does this plugin do? // Why would I use this plugin?**

1. Automations that trigger as frequent as every 30 seconds (rather than the 5 minute current HomeKit limitation) and are standard automation triggers instead of timer automations (meaning you can add additional triggers and conditions).
   - E.g. [Clock](#clock "Clock")
1. Digital switches with optional reset timers
   - E.g. [Motion Sensor Cooldown Switch](#motion-sensor-cooldown-switch "Motion Sensor Cooldown Switch")
   - E.g. [Ideal State Alarm](#ideal-state-alarm "Ideal State Alarm")
   - E.g. [Unresponsive Device Alarm](#unresponsive-device-alarm "Unresponsive Device Alarm")
1. Unresponsive device detection
   - E.g. [Unresponsive Device Alarm](#unresponsive-device-alarm "Unresponsive Device Alarm")
1. Digital security alarms and renotifying security alarms
   - E.g. [Unresponsive Device Alarm](#unresponsive-device-alarm "Unresponsive Device Alarm")

**Isn't this plugin just a combination of other plugins?**

Yes and no. While it is true that there are several other plugins that, when put together, add _most_ of the same functionality, there are three critical differences:

1. `homebridge-theneverstill` allows you to combine related Homebridge devices all under one accessory. This is not only cleaner, but also:
2. With all related devices under one accessory, you can fully leverage the benefits of child bridges _on each accessory_. Per Homebridge: `This can improve the general responsiveness and reliability of Homebridge.`
3. (Coming soon!) This plugin will be [verified by Homebridge](https://github.com/homebridge/verified "Verified By Homebridge"). Many plugins with related functionality are not, so you are left with a lower guarantee of bug fixes and enhancements.

## Homebridge Usage

### Install

1. Log in to your Homebridge deployment and navigate to the `Plugins` tab
1. Search for `theneverstill`
1. Click the `INSTALL` button

### Update

1. Log in to your Homebridge deployment and navigate to the `Plugins` tab
1. Find the plugin card for `Homebridge TheNeverStill`
1. Click the `UPDATE` button

### Add Accessories

1. Log in to your Homebridge deployment and navigate to the `Plugins` tab
1. Find the plugin card for `Homebridge TheNeverStill`
1. Click the `SETTINGS` button
1. Enter properties for accessories and optionally click the `+ ADD ACCESSORY` button to add new accessories
1. Click the `SAVE` button

### Recommended Accessories

#### Clock

**Purpose**

Suppose you want to be alerted within 30 seconds of a device going unresponsive (e.g. a sensor's batteries run out of juice). Or suppose you miss an important Home notification (e.g. alarm, motion, contact) and wish you could be renotified every 30 seconds until the problem is resolved. Wouldn't it be great if you could go beyond the 5 minute limit of timer automations (and their lack of conditions) by being able to trigger automations every 15 seconds?

1. Create an accessory with the following configuration ([see 'Add Accessories' steps above](#add-accessories "How to Add Accessories")):

   - Use default values for all properties not explicitly noted below.

   ```json
   {
     "name": "TNS Clock",
     "switchOneIsCreatable": true,
     "switchOneDefaultStateRevertTime": 30000,
     "switchTwoIsCreatable": true,
     "switchTwoDefaultStateRevertTime": 30000,
   },
   ```

1. Set the `TNS Clock` accessory to run a child bridge

   - The purpose of setting this accessory to run as a child bridge, per Homebridge: `This can improve the general responsiveness and reliability of Homebridge.`

   1. Log in to your Homebridge deployment and navigate to the `Plugins` tab
   1. Find the plugin card for `Homebridge TheNeverStill`
   1. Click the `wrench` (🔧) button
   1. Click the `Bridge Settings` dropdown option
   1. Toggle `on` the switch beside the `TNS Clock` accessory
   1. Click the `SAVE` button

1. Restart Homebridge

1. Add the `TNS Clock` accessory to HomeKit

   1. Log in to your Homebridge deployment and navigate to the `Plugins` tab
   1. Find the plugin card for `Homebridge TheNeverStill`
   1. Click the `wrench` (🔧) button
   1. Click the `Bridge Settings` dropdown option
   1. Open your HomeKit app (e.g. `Home`, `Eve`, `Controller for HomeKit`) and add a HomeKit Accessory using the QR code displayed under the `TNS Clock` accessory
      1. On the `Uncertified Accessory` prompt click the `Add Anyway` button
      1. Select or create a room, e.g. `Homebridge` Room
      1. Name the child bridge, e.g. `TNS Clock Bridge`
      1. Name the accessory (defined as a switch), e.g. `TNS Clock Switches`
      1. Name the child accessories
         1. e.g. `TNS Clock Tick Switch`
         1. e.g. `TNS Clock Tock Switch`

1. Add the `TNS Clock` scenes and automations

   1. `<Turn on TNS Clock Tick Switch Scene>`
      - Type: `Scene`
      - Name: `<Turn on TNS Clock Tick Switch Scene>`
      - Action: `Turn on TNS Clock Tick Switch`
   1. `<Turn on TNS Clock Tock Switch Scene>`
      - Type: `Scene`
      - Name: `<Turn on TNS Clock Tock Switch Scene>`
      - Action: `Turn on TNS Clock Tock Switch`
   1. `<TNS Clock Heartbeat Automation>`
      - Purpose: If your hub or Homebridge become unresponsive for an extended period of time Tick and Tock will stop working. This automation ensures Tick and Tock restart whenever your hub or Homebridge become responsive again. Additionally this automation resets Tick and Tock drift every 5 minutes.
      - Type: `Timer Automation`
      - The `Home` app does not support timer automations. You must use an advanced HomeKit app (e.g. `Eve`, `Controller for HomeKit`) to create them.
      - Name: `<TNS Clock Heartbeat Automation>`
      - Repeat: `every 5 minutes`
      - Starts at: `<the next 0/5 minute increment, e.g. Today at 11:40 AM, or Today at 2:45 PM, or Today at 2:50 PM; NOT Today at 10:33 AM>`
        - You can start the timer on any minute increment, but it is easier for most people to remember and predict if it happens on 0/5 minute increments
   1. `<TNS Clock Tick Off Automation>`
      - Type: `Trigger Automation`
      - Name: `<TNS Clock Tick Off Automation>`
      - Trigger: `TNS Clock Tick Switch Power Off`
      - Conditions: None
      - Scene: `<Turn on TNS Clock Tock Switch Scene>`
   1. `<TNS Clock Tock Off Automation>`
      - Type: `Trigger Automation`
      - Name: `<TNS Clock Tock Off Automation>`
      - Trigger: `TNS Clock Tock Switch Power Off`
      - Conditions: None
      - Scene: `<Turn on TNS Clock Tick Switch Scene>`

#### Motion Sensor Cooldown Switch

**Purpose**
Suppose you have one or more motion sensors that you use to trigger an automation that turns on some lights. How do you trigger the lights to turn off? Some motion sensors come with a customizable motion duration (until they stop reporting motion) that you could leverage, but many don't. Further, if you have multiple motion sensors on the same light trigger, you probably don't want the lights to turn off until `all` of the motion sensors are no longer detecting motion (after a cooldown period that you control). Wouldn't it be great if the lights only turned off after no motion was detected on multiple motion sensors for 5 minutes?

1. Create an accessory with the following configuration ([see 'Add Accessories' steps above](#add-accessories "How to Add Accessories")):

   - For best results you should:
     - Set the motion duration as small as possible on all of your sensors (where applicable)
     - Set a default state revert time that is longer that your sensors' motion duration
   - Use default values for all properties not explicitly noted below.

   ```json
   {
     "name": "TNS Entrance Light(s) Motion Cooldown Switch",
     "switchOneIsCreatable": true,
     "switchOneDefaultStateRevertTime": 300000,
   },
   ```

1. Set the `TNS Entrance Light(s) Motion Cooldown Switch` accessory to run a child bridge

   - The purpose of setting this accessory to run as a child bridge, per Homebridge: `This can improve the general responsiveness and reliability of Homebridge.`

   1. Log in to your Homebridge deployment and navigate to the `Plugins` tab
   1. Find the plugin card for `Homebridge TheNeverStill`
   1. Click the `wrench` (🔧) button
   1. Click the `Bridge Settings` dropdown option
   1. Toggle `on` the switch beside the `TNS Entrance Light(s) Motion Cooldown Switch` accessory
   1. Click the `SAVE` button

1. Restart Homebridge

1. Add the `TNS Entrance Light(s) Motion Cooldown Switch` accessory to HomeKit

   1. Log in to your Homebridge deployment and navigate to the `Plugins` tab
   1. Find the plugin card for `Homebridge TheNeverStill`
   1. Click the `wrench` (🔧) button
   1. Click the `Bridge Settings` dropdown option
   1. Open your HomeKit app (e.g. `Home`, `Eve`, `Controller for HomeKit`) and add a HomeKit Accessory using the QR code displayed under the `TNS Entrance Light(s) Motion Cooldown Switch` accessory
      1. On the `Uncertified Accessory` prompt click the `Add Anyway` button
      1. Select or create a room, e.g. `Homebridge` Room
      1. Name the child bridge, e.g. `TNS Entrance Light(s) Motion Cooldown Switch Bridge`
      1. Name the accessory (defined as a switch), e.g. `TNS Entrance Light(s) Motion Cooldown Switch`

1. Add the `TNS Entrance Light(s) Motion Cooldown Switch` scenes and automations

   1. `<Turn on Entrance Light Switch(es) After Motion Detected Scene>`
      - Type: `Scene`
      - Name: `<Turn on Entrance Light Switch(es) After Motion Detected Scene>`
      - Action:
        - `<Turn on entrance lights>`
        - `Turn on TNS Entrance Light(s) Motion Cooldown Switch`
   1. `<Turn off Entrance Light Switch(es) Scene>`
      - Type: `Scene`
      - Name: `<Turn off Entrance Light Switch(es) Scene>`
      - Action: `<Turn off entrance lights>`
   1. `<Automation to turn on light(s) when motion is detected>`
      - Type: `Trigger Automation`
      - Name: `<Automation to turn on light(s) when motion is detected>`
      - Trigger: `<Each desired motion sensor detecting motion>`
      - Conditions:
        - You'd think it'd be pretty easy to set `Before sunrise or after sunset`, but HomeKit interprets that as an impossible condition (since you must use `and` conditions). As such, you either need to:
          - Setup two almost identical automations (one with a `before sunrise` condition and the other with a `after sunset` condition), or
          - Setup a shortcut automation that can use `or` conditions and use specific times of the day (shortcut automations don't have sunrise and sunset time options), or
          - Use an outdoor light sensor as the condition (e.g. `<= 600 lux`)
      - Scene: `<Turn on Entrance Light Switch(es) After Motion Detected Scene>`
   1. `<Automation to turn off light(s) when motion is no longer detected>`
      - Type: `Trigger Automation`
      - Name: `<Automation to turn off light(s) when motion is no longer detected>`
      - Trigger: `TNS Entrance Light(s) Ideal State Alarm Power Off`
      - Conditions: None
      - Scene: `<Turn off Entrance Light Switch(es) Scene>`

#### Unresponsive Device Alarm Accessory

**Purpose**

Suppose you have one or more battery powered devices. How do you know when their batteries run out of juice? You could open the Home app on a periodic basis and individually check the battery level on each device. What happens if you forget? How much time would pass before you notice a device isn't working? How frustrated would you be when many of your dependant automations fail to get triggered? Wouldn't it be great if an alarm would go off whenever a device becomes unresponsive?

1. Create an accessory with the following configuration ([see 'Add Accessories' steps above](#add-accessories "How to Add Accessories")):

   - `switchOneDefaultStateRevertTime` should be about one to three minutes longer than the longest span you plan go to between device checks to allow for clock inconsistencies (e.g. if you plan to plan to run checks at 9am and 9pm, you should set it to be 12 hours and 3 minutes)
     - I typically set four checks so that two successive checks must fail in order to trigger the alarm.
   - `securitySystemOneRetriggerTime` should be set to however often you want to be renotified about unresponsive devices.

   ```json
   {
     "name": "TNS Unresponsive Battery Accessories Security System",
     "switchOneIsCreatable": true,
     "switchOneDefaultStateRevertTime": 43380000,
     "securitySystemOneIsCreatable": true,
     "securitySystemOneRetriggerTime": 300000
   },
   ```

1. Set the `TNS Unresponsive Battery Accessories Security System` accessory to run a child bridge

   - The purpose of setting this accessory to run as a child bridge, per Homebridge: `This can improve the general responsiveness and reliability of Homebridge.`

   1. Log in to your Homebridge deployment and navigate to the `Plugins` tab
   1. Find the plugin card for `Homebridge TheNeverStill`
   1. Click the `wrench` (🔧) button
   1. Click the `Bridge Settings` dropdown option
   1. Toggle `on` the switch beside the `TNS Unresponsive Battery Accessories Security System` accessory
   1. Click the `SAVE` button

1. Restart Homebridge

1. Add the `TNS Unresponsive Battery Accessories Security System` accessory to HomeKit

   1. Log in to your Homebridge deployment and navigate to the `Plugins` tab
   1. Find the plugin card for `Homebridge TheNeverStill`
   1. Click the `wrench` (🔧) button
   1. Click the `Bridge Settings` dropdown option
   1. Open your HomeKit app (e.g. `Home`, `Eve`, `Controller for HomeKit`) and add a HomeKit Accessory using the QR code displayed under the `TNS Unresponsive Battery Accessories Security System` accessory
      1. On the `Uncertified Accessory` prompt click the `Add Anyway` button
      1. Select or create a room, e.g. `Homebridge` Room
      1. Name the child bridge, e.g. `TNS Unresponsive Battery Accessories Security System Bridge`
      1. Name the accessory (defined as a switch), e.g. `TNS Unresponsive Battery Accessories Security System`
      1. Name the child accessories
         1. e.g. `TNS Unresponsive Battery Accessories Security System Canary Switch`
         1. e.g. `TNS Unresponsive Battery Accessories Security System Switch`
         1. e.g. `TNS Unresponsive Battery Accessories Security System`
         - Test the switches to determine which one natively triggers the security system. You may need to rename them accordingly.

1. Add the `TNS Unresponsive Battery Accessories Security System` scenes and automations

   1. `<Turn on TNS Unresponsive Battery Accessories Security System Canary Switch Scene>`
      - Type: `Scene`
      - Name: `<Turn on TNS Unresponsive Battery Accessories Security System Canary Switch Scene>`
      - Action: `Turn on TNS Unresponsive Battery Accessories Security System Canary Switch Scene`
   1. `<Turn on TNS Unresponsive Battery Accessories Security System Switch Scene>`
      - Type: `Scene`
      - Name: `<Turn on TNS Unresponsive Battery Accessories Security System Switch Scene>`
      - Action: `<Turn on TNS Unresponsive Battery Accessories Security System Switch Scene>`
   1. `<Turn on TNS Unresponsive Battery Accessories Security System Canary Switch Automation>`
      - This is a complex automation to create. You need to use an advanced HomeKit app (e.g. `Eve`, `Controller for HomeKit`) to initially create the automation so that it can have multiple triggers (you can select any existing scene to complete the automation creation). Then you must use the `Home` app to convert the automation into a shortcut automation.
        - Edit the automation, tap the `Select Accessories and Scenes...` button, scroll to the button, under the `ADVANCED` section tap the `Convert to Shortcut` button, and click the `x` button to delete the previously selected scene to run.
      - The way this automation works is that it will timeout if any of the `Get State of` devices are unresponsive. As such, the final scene will never run which eventually allows the `TNS Unresponsive Battery Accessories Security System Canary Switch` to revert (which triggers the next automation).
      - Type: `Shortcut Automation`
      - Name: `<Turn on TNS Unresponsive Battery Accessories Security System Canary Switch Automation>`
      - Triggers:
        - `At 8:00 AM Repeat every day`
        - `At 9:00 AM Repeat every day`
        - `At 8:00 PM Repeat every day`
        - `At 9:00 PM Repeat every day`
      - Conditions: None
      - Shortcut:
        - `Get state of Home` => `Get 'Accessory A' Characteristic 'Contact Sensor State'`
        - `Get state of Home` => `Get 'Accessory B' Characteristic 'Motion Detected'`
        - `Get state of Home` => `Get 'Accessory C' Characteristic 'Custom'`
        - `Control Home` => `Set 'Turn on TNS Unresponsive Battery Accessories Security System Canary Switch Scene'`
   1. `<Turn on TNS Unresponsive Battery Accessories Security System Switch Automation>`
      - Type: `Trigger Automation`
      - Name: `<Turn on TNS Unresponsive Battery Accessories Security System Switch Automation>`
      - Trigger: `TNS Unresponsive Battery Accessories Security System Canary Switch Power Off`
      - Conditions: None
      - Scene: `<Turn on TNS Unresponsive Battery Accessories Security System Switch Scene>`

#### Ideal State Alarm

**Purpose**

Suppose you wanted to ensure all of your doors, windows, curtains, and locks were closed at night. You could create an automation to run nightly that would close your curtains and lock your deadbolts and another automation to alert you when their state changes and isn't correct. But how do you track "what is correct"? And what happens if your Home hub glitches and doesn't trigger an automation when their state changes in the middle of the night (e.g. someone opens a window)? Wouldn't it be great if you had a way to easily define what the ideal state should be and use that value as conditions in your automations?

## Plugin Development

### Setup Development Environment

To develop Homebridge plugins you must have Node.js 12 or later installed and a modern code editor such as [VS Code](https://code.visualstudio.com/).

### Install Development Dependencies

Using a terminal, navigate to the project folder and run this command to install the development dependencies:

```sh
npm ci
```

### Build Plugin

TypeScript needs to be compiled into JavaScript before it can run. The following command will compile the contents of your [`src`](./src) directory and put the resulting code into the `dist` folder.

```sh
npm run build
```

### Link To Homebridge

Run this command so your global install of Homebridge can discover the plugin in your development environment:

```sh
npm link
```

You can now start Homebridge, use the `-D` flag so you can see debug log messages in your plugin:

```sh
homebridge -D
```

### Watch For Changes and Build Automatically

If you want to have your code compile automatically as you make changes and restart Homebridge automatically between changes you can run:

```sh
npm run watch
```

This will launch an instance of Homebridge in debug mode which will restart every time you make a change to the source code. It will load the config stored in the default location under `~/.homebridge`. You may need to stop other running instances of Homebridge while using this command to prevent conflicts. You can adjust the Homebridge startup command in the [`nodemon.json`](./nodemon.json) file.

### Publish Package

When you are ready to publish the plugin to [npm](https://www.npmjs.com/) run:

```sh
npm publish
```
