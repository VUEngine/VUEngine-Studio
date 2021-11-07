# VUEngine Studio

A Nintendo Virtual Boy development environment.


## License

VUEngine Studio is build with Eclipse Theia.

- [Eclipse Public License 2.0](LICENSE)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](LICENSE)

Excluded are the following third party binaries that are shipped with VUEngine Studio: 

- GCC by The GNU Project, with patches for V810 by ElmerPCFX
- Grit by Jasper Vijn, with patches for Virtual Boy by dasi
- hf-cli by thunderstruck
- MSYS by The MinGW Project
- prog-vb by William D. Jones
- RetroArch Web w/ Beetle VB core by the RetroArch and Mednafen teams


## Init

After cloning, load git submodules with

    yarn modules:init

They can be updated at a later point with

    yarn modules:update


## Development

### Documentation

Documentation on how to package Theia as a Desktop Product may be found [here](https://theia-ide.org/docs/blueprint_documentation/)


### Prerequisites

Make sure you're using node 12.14.1.

    nvm use 12.14.1


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
