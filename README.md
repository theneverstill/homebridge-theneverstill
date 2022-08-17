<p align="center">

<img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" width="150">

</p>

# Homebridge Plugin TheNeverStill

Homebridge plugin to add critical functionality to your HomeKit home.

## Setup Development Environment

To develop Homebridge plugins you must have Node.js 12 or later installed and a modern code editor such as [VS Code](https://code.visualstudio.com/).

## Install Development Dependencies

Using a terminal, navigate to the project folder and run this command to install the development dependencies:

```sh
npm install
```

## Build Plugin

TypeScript needs to be compiled into JavaScript before it can run. The following command will compile the contents of your [`src`](./src) directory and put the resulting code into the `dist` folder.

```sh
npm run build
```

## Link To Homebridge

Run this command so your global install of Homebridge can discover the plugin in your development environment:

```sh
npm link
```

You can now start Homebridge, use the `-D` flag so you can see debug log messages in your plugin:

```sh
homebridge -D
```

## Watch For Changes and Build Automatically

If you want to have your code compile automatically as you make changes and restart Homebridge automatically between changes you can run:

```sh
npm run watch
```

This will launch an instance of Homebridge in debug mode which will restart every time you make a change to the source code. It will load the config stored in the default location under `~/.homebridge`. You may need to stop other running instances of Homebridge while using this command to prevent conflicts. You can adjust the Homebridge startup command in the [`nodemon.json`](./nodemon.json) file.

## Publish Package

When you are ready to publish the plugin to [npm](https://www.npmjs.com/) run:

```sh
npm publish
```
