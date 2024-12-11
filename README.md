# VUEngine Studio

VUEngine Studio is a custom integrated development environment (IDE), tailor-made for [Nintendo Virtual Boy](https://www.virtual-boy.com) game development with [VUEngine](https://github.com/VUEngine/VUEngine-Core), our versatile, object oriented Nintendo Virtual Boy game engine.

![](VUEngine-Studio.png?raw=true)

## License

VUEngine Studio is built upon Eclipse Theia, a framework for building cloud and desktop IDEs using modern, state-of-the-art web technologies.

- [Eclipse Public License 2.0](LICENSE)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](LICENSE)

The following third party binaries that are shipped with VUEngine Studio come with their own licenses:

- GCC by the GNU Project, with patches for V810 by ElmerPCFX
- GNU Make by the GNU Project
- clang-format by the GNU Project
- Grit by Jasper Vijn, with patches for Virtual Boy by dasi
- HyperBoyCli by thunderstruck
- HyperFlasherCli by thunderstruck
- MSYS by the MinGW Project
- prog-vb by William D. Jones
- Retroarch Web with Beetle VB Core by the RetroArch and Mednafen teams

## Usage

Documentation on how to use VUEngine Studio can be found at https://www.vuengine.dev/documentation/.

## Building

### Prerequisites

Download node.js and install. Preferrably use nvm (Node Version Manager). On Windows, you'll need to grab nvm-windows from https://github.com/coreybutler/nvm-windows instead.

Make sure you're using node 18.

    nvm install 18
    nvm use 18

Install yarn.

    npm i -g yarn

On Linux systems, you'll need the following packages:

    sudo apt-get install -y g++ gcc make python3 pkg-config libx11-dev libxkbfile-dev libsecret-1-dev

On Windows, install Visual Studio Build Tools.

Install Python.

### Init

After cloning, load git submodules with

    yarn modules:init

They can be updated at a later point with

    yarn modules:update

### Build

To build the application in production mode:

    yarn && yarn build && yarn download:plugins

For a fast, less resource intensive build use the following. This will not minify the frontend app.

    yarn && yarn build:dev && yarn download:plugins

### Development

Open two terminals and execute one of the following commands in each.

    yarn watch
    yarn electron start

The first will do an incremental build on every code change you do. The latter will start the Electron frontend. Reload (CMD/Ctrl+R) to load your changes.

### Package the application

    yarn electron package

The packaged application is located in `applications/electron/dist`.

### Create a preview application (without packaging it)

    yarn electron package:preview

The packaged application is located in `applications/electron/dist`.

### Running E2E Tests

The E2E tests basic UI tests of the actual application.
This is done based on the preview of the packaged application.

    yarn electron package:preview
    yarn electron test

### Reporting feature requests and bugs

If you encounter bugs in VUEngine Studio please consider opening an issue in the [VUEngine Studio project on Github](https://github.com/VUEngine/VUEngine-Studio/issues/new/choose).
