## VUEngine Studio

A Virtual Boy development environment.


### Action plan

- Mostly bundled built-in VSCode extensions
    - vuengine/build
    - vuengine/pad-rom
    - vuengine/flashboy
    - vuengine/hyperflash
    - ...


### Bundled extensions

Before building the main app, build the bundled extensions.

#### Build bundled extensions

```sh
cd extensions/*
yarn prepare
yarn rebuild:electron
```

#### Test run bundled extensions

```sh
cd .\electron-app\
yarn start
```


### Build the application

```sh
yarn
yarn theia rebuild:electron
yarn theia build
```


### Test run the application

```sh
yarn start
```


### Package the application

```sh
yarn package
```

Or create a preview application (without packaging it)

```sh
yarn package:preview
```


### Troubleshooting

- [_"Don't expect that you can build app for all platforms on one platform."_](https://www.electron.build/multi-platform-build)