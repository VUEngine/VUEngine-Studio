# Project Update Instructions

This document describes which breaking changes have been made to VUEngine Studio and VUEngine Core and which actions need to be taken by the developer in order to update existing VUEngine Studio projects.

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
