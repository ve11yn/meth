import { useState, useRef, type DragEvent } from "react";
import { Upload, FileImage } from "lucide-react";

const FileUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      fetch("/upload", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => console.log("Upload successful: ", data))
        .catch((err) => console.error("Upload error:", err));
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-900/50 border border-gray-800 backdrop-blur-sm rounded-lg max-h-[600px]">
        <div className="p-6">
          <div
            className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-gray-600 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-xl font-light mb-2 text-white">Upload your math problem</h3>
            <p className="text-gray-400 mb-4">Drag and drop an image or click to browse</p>
            <button 
              type="button"
              className="border border-gray-700 text-gray-300 hover:bg-gray-800 bg-transparent px-3 py-2 rounded-md inline-flex items-center transition-colors text-sm"
            >
              <FileImage className="mr-2 h-4 w-4" />
              Choose Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {file && (
              <p className="mt-3 text-sm text-gray-300">Selected: {file.name}</p>
            )}
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 mb-2">Supports: JPG, PNG, HEIC, WebP</p>
          </div>

          {file && (
            <div className="mt-4 text-center">
              <button
                onClick={handleUpload}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md transition-colors text-sm"
              >
                Upload File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;