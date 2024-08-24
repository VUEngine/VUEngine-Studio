# Project Update Instructions

This document describes which breaking changes have been made to VUEngine Studio and VUEngine Core and which actions need to be taken by the developer in order to update existing VUEngine Studio projects.

## VUEngine Studio Preview v0.5.0

### Relative source file paths

#### What has changed?

Source file paths referenced from several custom file files are now stored relative to the respective config file, rather than the workspace root. Affected file types:

- `*.entity`
- `*.image`
- `*.pcm`

#### How to update projects

Adjust file paths if you use any of the above file types. To do so, open the files in source mode, e.g. by clicking the curly braces icon to the top left of the respective file's editor.

Example:

```diff
assets/Entity/MyEntity/MyEntity.entity:

"files": [
-	"assets/Entity/MyEntity/MyEntity.png"
+	"MyEntity.png"
],
```

### Entity collision flags

#### What has changed?

The `Entity` class now has different flags to keep track of collision checks and if enabled instead of a single one.

- Removed `allowCollisions`
- Added `collisionsEnabled`
- Added `checkingCollisions`

In this context, a few methods have been renamed.

- `Collider::activeCollisionChecks` -> `Collider::checkCollisions`
- `Entity::allowCollisions` -> `Entity::collisionsEnabled`
- `Entity::activeCollisionChecks` -> `Entity::checkCollisions`

Note that the above also affect inheriting classes like `Actor`.

#### How to update projects

If you use any of these methods or flags in your project, update accordingly.

Example:

```diff
-	SomeEntity::activeCollisionChecks(this, false);
+	SomeEntity::checkCollisions(this, false);
```

### Renamed HardwareManager and VIPManager methods

#### What has changed?

Some methods related to the VIP's drawing and displaying operations have been renamed.

- `HardwareManager::enableRendering()` -> `HardwareManager::startDrawing()`
- `HardwareManager::disableRendering()` -> `HardwareManager::stopDrawing()`
- `HardwareManager::displayOn()` -> `HardwareManager::turnDisplayOn()`
- `HardwareManager::displayOff()` -> `HardwareManager::turnDisplayOff()`
- `VIPManager::enableDrawing()` -> `VIPManager::startDrawing()`
- `VIPManager::disableDrawing()` -> `VIPManager::stopDrawing()`
- `VIPManager::displayOn()` -> `VIPManager::turnDisplayOn()`
- `VIPManager::displayOff()` -> `VIPManager::turnDisplayOff()`

#### How to update projects

If you use any of these methods in your project, update method calls accordingly.

### VirtualList push methods return type

#### What has changed?

`VirtualList::pushFront` and `VirtualList::pushBack` now return a `VirtualNode`instead of an `int32`.

#### How to update projects

If you're working with VirtualLists and use the above method(s), you want to update your code accordingly.

```diff
-	SomeActor::activeCollisionChecks(this, false);
+	SomeActor::checkCollisions(this, false);
```

### Moved lastCameraDisplacement Vector

#### What has changed?

The `CameraMovementManager->lastCameraDisplacement` vector has been moved to `Camera->lastDisplacement`.

#### How to update projects

If your code accesses the vector, update accordingly.

## VUEngine Studio Preview v0.4.0

### PositionedEntitySpec

#### What has changed?

`PositionedEntitySpec` has been updated to include initial rotation and scale. Also, the unused z displacement value has been removed from its position vector.

#### How to update projects

Update all other occurences of PositionedEntitySpec and PositionedEntityROMSpec accordingly, e.g. in stage specs.

Example:

```diff
PositionedEntityROMSpec ExampleStageEntitySpecs[] =
{
-	{&ExampleEntitySpec, {8, 16, 4, 0}, 0, NULL, NULL, NULL, false},
+	{&ExampleEntitySpec, {8, 16, 4}, {0, 0, 0}, {1, 1, 1}, 0, NULL, NULL, NULL, false},
```

### CompilerConfig

#### What has changed?

The CompilerConfig editor has been rewritten to include additional explanations and be more self explanatory. It now stores `memorySections.dram.length` as a positive rather than a negative value. Furthermore, the `output` value has been removed.

#### How to update projects

Open `config/CompilerConfig` and change the value of `memorySections.dram.length` from a negative to a positive value. When using the graphical editor, the file will be matched against a default config when the editor loads, which should automatically remove the `output` value. Upon saving the changes, VUEngine Studio will automatically regenerate all affected files.

Example:

```diff
	"memorySections": {
		"dram": {
-			"length": -32,
+			"length": 32,
```

### Utilities -> Math.

#### What has changed?

Following methods have been moved from the Utilities class to the Math class.

- floor
- getDigitsCount
- haveEqualSign
- random
- randomSeed
- resetRandomSeed

#### How to update projects

If you use any of these methods in your project, update method calls accordingly.

Example:

```diff
-	int32 flooredValue = (int32)Utilities::floor(value);
+	int32 flooredValue = (int32)Math::floor(value);
```
