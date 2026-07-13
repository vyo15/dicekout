export const inspectImage = (buffer, mime) => {
  if (mime === "image/png" && buffer.length >= 24 && buffer.subarray(1,4).toString() === "PNG") {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), extension: "png" };
  }
  if (mime === "image/webp" && buffer.subarray(0,4).toString() === "RIFF" && buffer.subarray(8,12).toString() === "WEBP") {
    const kind = buffer.subarray(12,16).toString();
    if (kind === "VP8X" && buffer.length >= 30) return { width: 1 + buffer.readUIntLE(24,3), height: 1 + buffer.readUIntLE(27,3), extension: "webp" };
    return { width: 0, height: 0, extension: "webp" };
  }
  if (mime === "image/jpeg" && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7), extension: "jpg" };
      }
      offset += 2 + length;
    }
  }
  throw new Error("Format atau signature gambar tidak didukung.");
};
