export type UploadPreview = {
  dataUrl?: string;
  meta: string;
  name: string;
};

export function readUploadFile(file: File) {
  return new Promise<UploadPreview>((resolve, reject) => {
    const meta = `${(file.size / 1024 / 1024).toFixed(1)} MB`;

    if (!file.type.startsWith('image/')) {
      resolve({ meta, name: file.name });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        dataUrl: typeof reader.result === 'string' ? reader.result : undefined,
        meta,
        name: file.name,
      });
    };
    reader.onerror = () => {
      reject(new Error('Unable to read the selected file.'));
    };
    reader.readAsDataURL(file);
  });
}

type CompressImageOptions = {
  maxHeight?: number;
  maxInlineImageLength?: number;
  maxWidth?: number;
  qualities?: number[];
};

export function compressImageFile(file: File, options: CompressImageOptions = {}) {
  return new Promise<string>((resolve, reject) => {
    const {
      maxHeight = 540,
      maxInlineImageLength = 90_000,
      maxWidth = 960,
      qualities = [0.78, 0.68, 0.58, 0.48, 0.38, 0.3],
    } = options;
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Canvas is not available.'));
        return;
      }

      const baseScale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
      let width = Math.max(1, Math.round(image.width * baseScale));
      let height = Math.max(1, Math.round(image.height * baseScale));

      for (let resizeAttempt = 0; resizeAttempt < 6; resizeAttempt += 1) {
        canvas.width = width;
        canvas.height = height;
        context.clearRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        for (const quality of qualities) {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);

          if (dataUrl.length <= maxInlineImageLength) {
            resolve(dataUrl);
            return;
          }
        }

        width = Math.max(1, Math.round(width * 0.78));
        height = Math.max(1, Math.round(height * 0.78));
      }

      reject(new Error('Image is too large. Please choose a smaller cover image.'));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read the selected image.'));
    };

    image.src = objectUrl;
  });
}
