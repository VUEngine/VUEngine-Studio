# VUEngine Studio

A Nintendo Virtual Boy development environment.


## License

VUEngine Studio is build upon Eclipse Theia.

- [Eclipse Public License 2.0](LICENSE)
- [一 (Secondary) GNU General Public License, version 2 with the GNU Classpath Exception](LICENSE)


## Init

After cloning, load git submodules with

```sh
yarn modules:init
```

They can be updated at a later point with

```sh
yarn modules:update
```


## Development

### Documentation

Documentation on how to package Theia as a Desktop Product may be found [here](https://theia-ide.org/docs/blueprint_documentation/)


### Repository structure

- Root level configures mono-repo build with lerna
- `applications` groups the different app targets
  - `electron` contains app to package, packaging configuration, and E2E tests for the electron target.
- `extensions` groups the various custom theia extensions for VUEngine Studio
  - `vuengine-studio-branding` contains a Theia extension contributing the product branding (about dialog, welcome page, various modifications, title bar, etc).
  - `vuengine-studio-projects` contains a Theia extension contributing project management functionality.
  - `vuengine-studio-updater` contains a Theia extension contributing the update mechanism and corresponding UI elements (based on the electron updater).


### Build

```sh
yarn
```


### Package the application

```sh
yarn electron package
```

The packaged application is located in `applications/electron/dist`.


### Create a preview application (without packaging it)

```sh
yarn electron package:preview
```

The packaged application is located in `applications/electron/dist`.


### Running E2E Tests

The E2E tests basic UI tests of the actual application.
This is done based on the preview of the packaged application.

```sh
yarn electron package:preview
yarn electron test
```


### Troubleshooting

- [_"Don't expect that you can build app for all platforms on one platform."_](https://www.electron.build/multi-platform-build)


### Reporting feature requests and bugs

If you encounter bugs in VUEngine Studio please consider opening an issue in the [VUEngine Studio project on Github](https://github.com/VUEngine/VUEngine-Studio/issues/new/choose).
