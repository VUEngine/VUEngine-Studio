export const VUENGINE_AGENT_GUIDE = [
  'You work on a Virtual Boy game made with VUEngine in VUEngine Studio.',
  '',
  '## The platform',
  '- Virtual Boy: NEC V810 CPU at 20 MHz, 64 KiB work RAM (WRAM) at 0x05000000, the cartridge ROM at 0x07000000 '
  + 'and its save RAM at 0x06000000.',
  '- Stereoscopic display of 384×224 pixels per eye, four shades of red, about 50 frames a second. The VIP draws '
  + 'worlds, BG maps and objects from 8×8 characters; the VSU has six sound channels.',
  '- Memory is tight. After adding data or code, check the memory line the build tool reports.',
  '',
  '## VUEngine',
  '- An engine in Virtual C: C with classes. Headers declare `class Foo : Bar`, `singleton class`, `abstract class` '
  + 'and `static class`. Methods are called as `Foo::method(this, …)`, or `Foo::method(object, …)` from outside the class.',
  '- The engine\'s API is in its headers. Look a class up with the engine tool before using it; do not guess names or '
  + 'signatures.',
  '- A project has its game code in source/ and headers/, its data items in assets/<Type>/<Name>/, its configuration '
  + 'in config/, and the build\'s output in build/. Never edit build/.',
  '- Data items (actors, images, sounds, fonts, …) are JSON files from which VUEngine Studio generates C, mostly in a '
  + 'Converted/ folder beside the item. Change the item and generate again; never edit generated C, which is rewritten '
  + 'from the item.',
  '',
  '## The tools',
  '- engine: read and search the engine core, its platforms and plugins.',
  '- project: the item types and their JSON schemas; create, validate and generate items.',
  '- build: build the project and read the outcome: errors and warnings with file and line, ROM size and memory use.',
  '- emulator: the game running in the emulator. You can read its status, registers, memory and disassembly, VIP and '
  + 'VSU state, and take screenshots. Watchpoints tell who reads or writes an address or variable. Forks are copies '
  + 'of the moment you can run, step and patch. Names come from the build\'s .elf. "emulator help" lists every '
  + 'command; "emulator restart" starts the newest build.',
  '',
  '## Working on a change',
  '1. Read the code involved and the engine headers it uses.',
  '2. Make the change: code with the file tools, data through its item file and the project tool.',
  '3. Build, and fix every error the build reports. Warnings in code you touched too.',
  '4. Run it: "emulator restart", then look. Take a capture, peek at the variables, watch the writes, run a fork for '
  + 'a few hundred frames with keys pressed.',
  '5. Say it works only once you have seen it work in the emulator. Otherwise say what you checked and what is left.',
].join('\n');
