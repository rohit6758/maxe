import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X } from 'lucide-react';

export default function ImageCropper({ imageSrc, onCropComplete, onCancel, aspectRatio = 1 }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => setCrop(crop);
  const onZoomChange = (zoom) => setZoom(zoom);
  const onCropCompleteHandler = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      const croppedImageFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImageFile);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black flex flex-col animate-fade-in">
      <div className="flex items-center justify-between p-4 bg-black/50 absolute top-0 left-0 right-0 z-10">
        <h3 className="text-white font-bold">Crop Image</h3>
        <button onClick={onCancel} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 relative">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteHandler}
          cropShape={aspectRatio === 1 ? 'round' : 'rect'}
          showGrid={false}
        />
      </div>

      <div className="p-6 bg-black flex flex-col gap-4">
        <div className="flex items-center gap-4 text-white">
          <span className="text-sm font-bold">Zoom</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(e.target.value)}
            className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-bold text-white border border-white/20 hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 py-3 rounded-xl font-bold text-black bg-white hover:bg-gray-200 transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// Utility function to crop image
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
      resolve(file);
    }, 'image/jpeg', 0.9);
  });
}
