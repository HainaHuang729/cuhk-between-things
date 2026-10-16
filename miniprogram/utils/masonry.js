const COLUMN_WIDTH = 348;
const TITLE_WIDTH = COLUMN_WIDTH - 28;

function estimateCardHeight(item, imageSizes) {
  const size = !item.image_error && imageSizes[item.cover_image_url];
  const imageHeight = size && size.width > 0 && size.height > 0
    ? COLUMN_WIDTH * size.height / size.width
    : Number(item.placeholder_height) || 260;
  const titleWidth = Array.from(item.title || "").reduce((width, character) => (
    width + (character.codePointAt(0) > 255 ? 28 : 14)
  ), 0);
  const titleLines = Math.min(2, Math.max(1, Math.ceil(titleWidth / TITLE_WIDTH)));
  return imageHeight + titleLines * 36 + 116;
}

function buildMasonryColumns(items, imageSizes = {}) {
  const columns = [{ id: "left", items: [] }, { id: "right", items: [] }];
  const heights = [0, 0];

  // Estimate placement only. Images and text retain their natural rendered heights.
  for (const item of items) {
    const index = heights[0] <= heights[1] ? 0 : 1;
    columns[index].items.push(item);
    heights[index] += estimateCardHeight(item, imageSizes);
  }
  return columns;
}

module.exports = { buildMasonryColumns };
