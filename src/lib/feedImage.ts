// Feed product photos — resize on upload so a big phone photo is stored
// small. The admin picks any picture; it is drawn onto a canvas at most
// 600px on its longest side and saved as a JPEG (quality 0.82), so the
// stored value stays ~40–90 KB no matter how large the original was.
// The result is a data URL stored in the feed row's image_url column,
// which travels with the row data (and the offline cache), so it works
// offline too — no Storage bucket needed.

export const FEED_IMAGE_MAX_DIM = 600;
export const FEED_IMAGE_QUALITY = 0.82;

/** Resize an uploaded image file to a small JPEG data URL. */
export function resizeImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a readable image.'));
      img.onload = () => {
        const scale = Math.min(
          1,
          FEED_IMAGE_MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight),
        );
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not process the image.'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', FEED_IMAGE_QUALITY));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/** True when a stored image value is usable (a data URL or an http URL). */
export function hasFeedImage(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    (value.startsWith('data:image/') || value.startsWith('http'))
  );
}
