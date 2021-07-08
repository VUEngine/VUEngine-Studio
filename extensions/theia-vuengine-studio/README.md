# theia-vuengine-studio

Adds all VUEngine Studio specific functionality and customizations.

## Getting started

Install [nvm](https://github.com/creationix/nvm#install-script).

    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.5/install.sh | bash

Install npm and node.

    nvm install 10
    nvm use 10

Install yarn.

    npm install -g yarn

Install Python.

## Running the browser example

    yarn start:browser

_or:_

    yarn rebuild:browser
    cd browser-app
    yarn start

_or:_ launch `Start Browser Backend` configuration from VS code.

Open http://localhost:3000 in the browser.

## Running the Electron example

    yarn start:electron

_or:_

    yarn rebuild:electron
    cd electron-app
    yarn start

_or:_ launch `Start Electron Backend` configuration from VS code.

## Developing with the browser example

Start watching all packages, including `browser-app`, of your application with

    yarn watch

_or_ watch only specific packages with

    cd theia-vuengine-studio
    yarn watch

and the browser example.

    cd browser-app
    yarn watch

Run the example as [described above](#Running-the-browser-example)

## Developing with the Electron example

Start watching all packages, including `electron-app`, of your application with

    yarn watch

_or_ watch only specific packages with

    cd theia-vuengine-studio
    yarn watch

and the Electron example.

    cd electron-app
    yarn watch

Run the example as [described above](#Running-the-Electron-example)
