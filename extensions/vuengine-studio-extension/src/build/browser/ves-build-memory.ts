export interface MemoryRegionUsage {
  name: string;
  origin: number;
  length: number;
  used: number;
}

export function readMemoryUsage(map: string, romSize: number): MemoryRegionUsage[] {
  const lines = map.split(/\r?\n/);
  const regions: MemoryRegionUsage[] = [];
  const configuration = lines.findIndex(line => line.trim() === 'Memory Configuration');
  if (configuration < 0) {
    return regions;
  }
  for (const line of lines.slice(configuration + 1)) {
    if (line.startsWith('Linker script')) {
      break;
    }
    const region = /^(\w+)\s+0x([0-9a-f]+)\s+0x([0-9a-f]+)/i.exec(line);
    if (region) {
      const length = region[1] === 'rom' && romSize > 0 ? romSize : parseInt(region[3], 16);
      regions.push({ name: region[1], origin: parseInt(region[2], 16), length, used: 0 });
    }
  }
  const regionOf = (address: number): MemoryRegionUsage | undefined =>
    regions.find(region => address >= region.origin && address < region.origin + Math.max(region.length, 1));

  for (let i = 0; i < lines.length; i++) {
    // Output sections start in the first column.
    // A long name puts the address and size on the next line.
    const name = /^(\.[\w.]+)(.*)$/.exec(lines[i]);
    if (!name) {
      continue;
    }
    const rest = name[2].trim() ? name[2] : lines[i + 1] ?? '';
    const section = /^\s+0x([0-9a-f]+)\s+0x([0-9a-f]+)(?:\s+load address 0x([0-9a-f]+))?/i.exec(rest);
    if (!section) {
      continue;
    }
    const size = parseInt(section[2], 16);
    if (size === 0) {
      continue;
    }
    const home = regionOf(parseInt(section[1], 16));
    if (home) {
      home.used += size;
    }
    if (section[3] !== undefined && !name[1].includes('bss')) {
      const load = regionOf(parseInt(section[3], 16));
      if (load && load !== home) {
        load.used += size;
      }
    }
  }
  return regions;
}

/** "ROM 444.1 KiB of 512 KiB (87 %)": the regions a build uses, and the ROM and RAM always. */
export function describeMemoryUsage(regions: MemoryRegionUsage[]): string {
  return regions
    .filter(region => region.used > 0 || ['rom', 'wram'].includes(region.name))
    .map(region => {
      const whole = region.name === 'sram' || region.name === 'exp'
        ? ''
        : ` of ${formatBytes(region.length)} (${Math.round(region.used * 100 / region.length)} %)`;
      return `${region.name.toUpperCase()} ${formatBytes(region.used)}${whole}`;
    })
    .join(', ');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }
  const kib = bytes / 1024;
  return `${Number.isInteger(kib) ? kib : kib.toFixed(1)} KiB`;
}
