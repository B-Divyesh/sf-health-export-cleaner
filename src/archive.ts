interface ZipEntry { name: string; content: string }

const encoder = new TextEncoder();

export function createZip(entries: ZipEntry[]): Blob {
  const files = entries.map((entry) => {
    const name = encoder.encode(entry.name);
    const data = encoder.encode(entry.content);
    return { name, data, crc: crc32(data) };
  });
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  const { date, time } = dosDateTime(new Date());

  for (const file of files) {
    const local = new Uint8Array(30 + file.name.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(10, time, true); view.setUint16(12, date, true);
    view.setUint32(14, file.crc, true);
    view.setUint32(18, file.data.length, true); view.setUint32(22, file.data.length, true);
    view.setUint16(26, file.name.length, true);
    local.set(file.name, 30);
    localParts.push(local, file.data);

    const central = new Uint8Array(46 + file.name.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true); centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(12, time, true); centralView.setUint16(14, date, true);
    centralView.setUint32(16, file.crc, true);
    centralView.setUint32(20, file.data.length, true); centralView.setUint32(24, file.data.length, true);
    centralView.setUint16(28, file.name.length, true);
    centralView.setUint32(42, offset, true);
    central.set(file.name, 46);
    centralParts.push(central);
    offset += local.length + file.data.length;
  }

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true); endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true); endView.setUint32(16, offset, true);
  const parts = [...localParts, ...centralParts, end];
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let position = 0;
  for (const part of parts) { output.set(part, position); position += part.length; }
  return new Blob([output.buffer], { type: 'application/zip' });
}

function dosDateTime(value: Date): { date: number; time: number } {
  const year = Math.max(1980, value.getFullYear());
  return {
    date: ((year - 1980) << 9) | ((value.getMonth() + 1) << 5) | value.getDate(),
    time: (value.getHours() << 11) | (value.getMinutes() << 5) | Math.floor(value.getSeconds() / 2)
  };
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
