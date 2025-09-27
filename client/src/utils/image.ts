export async function resizeImageFile(
  file: File,
  options: { maxSize?: number; quality?: number } = {}
): Promise<string> {
  const { maxSize = 512, quality = 0.8 } = options;

  const dataUrl = await readFileAsDataURL(file);
  const image = await loadImage(dataUrl);

  const { canvas, context } = createCanvas(image, maxSize);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const outputFormat = file.type.includes('png') ? 'image/png' : 'image/jpeg';
  const compressedUrl = canvas.toDataURL(outputFormat, quality);

  return compressedUrl.split(',')[1] || '';
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (err) => reject(err);
    image.src = src;
  });
}

function createCanvas(image: HTMLImageElement, maxSize: number) {
  const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
  const width = Math.round(image.width * ratio);
  const height = Math.round(image.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Unable to obtain canvas context');
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  return { canvas, context };
}
