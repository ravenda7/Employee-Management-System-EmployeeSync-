import React from 'react';
import {Upload, X } from 'lucide-react';

interface ImageUploadProps {
  image?: File | null;
  setImage: (images: File | null) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  image,
  setImage,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file)
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {image ? (
        <div className=' flex items-center justify-start'>
            <div className="relative group w-[72px] h-[72px] border border-gray-300 rounded-[8px] overflow-hidden">
                <img
                    src={URL.createObjectURL(image)}
                    alt="Variant"
                    className="object-cover w-full h-full"
                />
                <button
                    type="button"
                        onClick={(e) => {
                        e.stopPropagation();
                        setImage(null);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-pointer"
                        aria-label="Remove image"
                    >
                        <X className="w-3 h-3" />
                </button>
            </div>
        </div>
      ) : (
        <div className="w-full border border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-500 hover:border-gray-500 transition cursor-pointer py-4">
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-xs gap-1">
            <Upload className="h-4 w-4" />
             Upload Your Profile Picture
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />
          </label>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
