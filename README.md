# VUEngine Studio

VUEngine Studio is a custom integrated development environment (IDE), tailor-made for Virtual Boy game development with [VUEngine](https://github.com/VUEngine/VUEngine-Core), our versatile, object oriented Nintendo Virtual Boy game engine.

<img src="VUEngine-Studio.png?raw=true" style="max-width:800px;margin-left:-30px;">


## License

VUEngine Studio is built upon Eclipse Theia, a framework for building cloud and desktop IDEs using modern, state-of-the-art web technologies.

- [Eclipse Public License 2.0](LICENSE)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](LICENSE)

The following third party binaries that are shipped with VUEngine Studio come with their own licenses: 

- GCC by The GNU Project, with patches for V810 by ElmerPCFX
- Grit by Jasper Vijn, with patches for Virtual Boy by dasi
- hf-cli by thunderstruck
- MSYS by The MinGW Project
- prog-vb by William D. Jones
- RetroArch Web w/ Beetle VB core by the RetroArch and Mednafen teams


## Usage

Documentation on how to use VUEngine Studio can be found at https://www.vuengine.dev/documentation/.


## Building

### Prerequisites

Download node.js 12.14.1 and install. You can download it from https://nodejs.org/en/download/releases/ or alternatively use nvm (Node Version Manager). On Windows, you'll need to grab nvm-windows from https://github.com/coreybutler/nvm-windows instead.

Make sure you're using node 12.14.1.

    nvm install 12.14.1
    nvm use 12.14.1

Install yarn.

    npm i -g yarn

On Linux systems, you'll need the following packages:

    sudo apt-get install -y g++ gcc make python2.7 pkg-config libx11-dev libxkbfile-dev libsecret-1-dev

On Windows, install Visual Studio Build Tools.

Install Python.


### Init

After cloning, load git submodules with

    yarn modules:init

They can be updated at a later point with

    yarn modules:update


### Build

    yarn --ignore-engines


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


### Troubleshooting

- [_"Don't expect that you can build app for all platforms on one platform."_](https://www.electron.build/multi-platform-build)


### Reporting feature requests and bugs

If you encounter bugs in VUEngine Studio please consider opening an issue in the [VUEngine Studio project on Github](https://github.com/VUEngine/VUEngine-Studio/issues/new/choose).
