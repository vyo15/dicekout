import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";

import { processProductImage } from "../server/imageProcessor.mjs";

test("large JPEG is auto-oriented, resized, stripped, and converted to one WebP", async () => {
  const input = await sharp({
    create: { width: 2600, height: 1800, channels: 3, background: { r: 180, g: 120, b: 70 } },
  })
    .jpeg({ quality: 100 })
    .withMetadata({ orientation: 6, exif: { IFD0: { Artist: "DicekOut test" } } })
    .toBuffer();

  const result = await processProductImage({
    buffer: input,
    suppliedMime: "image/jpeg",
    slug: "Lampu Meja LED",
    originalName: "IMG_001.JPG",
  });
  const outputMetadata = await sharp(result.buffer).metadata();

  assert.equal(outputMetadata.format, "webp");
  assert.ok(outputMetadata.width <= 1200);
  assert.ok(outputMetadata.height <= 1200);
  assert.equal(outputMetadata.exif, undefined);
  assert.equal(result.finalName, `lampu-meja-led-${result.hash.slice(0, 12)}.webp`);
  assert.equal(result.path, `images/products/${result.finalName}`);
  assert.equal(result.original.name, "IMG_001.JPG");
  assert.equal(result.optimized.format, "WebP");
});

test("transparent PNG keeps alpha and small images are not upscaled", async () => {
  const input = await sharp({
    create: { width: 320, height: 240, channels: 4, background: { r: 20, g: 80, b: 140, alpha: 0.45 } },
  }).png().toBuffer();

  const result = await processProductImage({ buffer: input, suppliedMime: "image/png", slug: "produk transparan" });
  const metadata = await sharp(result.buffer).metadata();

  assert.equal(metadata.width, 320);
  assert.equal(metadata.height, 240);
  assert.equal(metadata.hasAlpha, true);
  assert.equal(result.optimized.hasAlpha, true);
});

test("same valid input produces the same content-hash filename", async () => {
  const input = await sharp({
    create: { width: 900, height: 900, channels: 3, background: { r: 10, g: 20, b: 30 } },
  }).png().toBuffer();

  const first = await processProductImage({ buffer: input, suppliedMime: "image/png", slug: "produk sama" });
  const second = await processProductImage({ buffer: input, suppliedMime: "image/png", slug: "produk sama" });

  assert.equal(first.hash, second.hash);
  assert.equal(first.finalName, second.finalName);
});

test("invalid image and MIME mismatch are rejected without fallback storage", async () => {
  await assert.rejects(
    processProductImage({ buffer: Buffer.from("not-an-image"), suppliedMime: "image/jpeg" }),
    /gambar yang valid/i,
  );

  const png = await sharp({ create: { width: 20, height: 20, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(
    processProductImage({ buffer: png, suppliedMime: "image/jpeg" }),
    /tidak cocok/i,
  );
});
