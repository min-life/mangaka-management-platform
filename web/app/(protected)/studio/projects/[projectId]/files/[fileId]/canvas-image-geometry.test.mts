import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getContainedImageRect,
  mapImageRegionToCanvas,
} from './canvas-image-geometry.ts';

test('maps a portrait image to its centered contain area', () => {
  const rect = getContainedImageRect(
    { height: 1_000, width: 1_600 },
    { naturalHeight: 2_000, naturalWidth: 1_000 },
  );

  assert.deepEqual(rect, {
    height: 1_000,
    left: 550,
    top: 0,
    width: 500,
  });
});

test('maps a landscape image to its centered contain area', () => {
  const rect = getContainedImageRect(
    { height: 1_000, width: 1_600 },
    { naturalHeight: 1_000, naturalWidth: 2_000 },
  );

  assert.deepEqual(rect, {
    height: 800,
    left: 0,
    top: 100,
    width: 1_600,
  });
});

test('falls back to the full canvas until image dimensions are available', () => {
  const rect = getContainedImageRect({ height: 1_000, width: 1_600 }, null);

  assert.deepEqual(rect, {
    height: 1_000,
    left: 0,
    top: 0,
    width: 1_600,
  });
});

test('maps image-normalized AI coordinates into the existing canvas coordinate system', () => {
  const imageRect = getContainedImageRect(
    { height: 1_000, width: 1_600 },
    { naturalHeight: 2_000, naturalWidth: 1_000 },
  );

  const region = mapImageRegionToCanvas(
    { endX: 0.5, endY: 0.7, startX: 0.1, startY: 0.2 },
    imageRect,
    { height: 1_000, width: 1_600 },
  );

  assert.deepEqual(region, {
    endX: 0.5,
    endY: 0.7,
    startX: 0.375,
    startY: 0.2,
  });
});
