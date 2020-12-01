## VUEngine Studio

A Virtual Boy development environment.

### Init

After cloning, load the submodules with

```sh
git submodule update --init
```

### Bundled extensions

Before building the main app, build the bundled extensions.

#### Build bundled extensions and plugins

For every bundled extension, do the following:

```sh
cd extensions/*
yarn
yarn rebuild:electron
```

For every bundled plugin, do the following:

```sh
cd plugins/*
yarn
yarn compile
```

#### Test run bundled extensions

```sh
cd .\electron-app\
yarn start
```

### Build the application

Preparation

```sh
nvm use 12
```

```sh
yarn
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
