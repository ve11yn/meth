import { useState, useRef, type DragEvent } from "react";
import { Upload, FileImage, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface UploadResponse {
  success: boolean;
  message: string;
  filename?: string;
  file_path?: string;
  image_info?: {
    width: number;
    height: number;
    format: string;
    mode: string;
  };
  error?: string;
}

const FileUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (response.ok && data.success) {
        setUploadResult(data);
        console.log("Upload successful:", data);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err) {
      setError("Network error: Unable to connect to server");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const resetUploader = () => {
    setFile(null);
    setUploadResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
              disabled={uploading}
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

          {file && !uploadResult && (
            <div className="mt-4 text-center">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md transition-colors text-sm inline-flex items-center"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload File'
                )}
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Success Display */}
          {uploadResult && (
            <div className="mt-4 p-4 bg-green-900/50 border border-green-700 rounded-md">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <p className="text-green-300 font-medium">Upload Successful!</p>
              </div>
              <p className="text-green-200 text-sm mb-2">{uploadResult.message}</p>
              {uploadResult.image_info && (
                <div className="text-xs text-green-300 space-y-1">
                  <p>Format: {uploadResult.image_info.format}</p>
                  <p>Dimensions: {uploadResult.image_info.width} × {uploadResult.image_info.height}</p>
                </div>
              )}
              <button
                onClick={resetUploader}
                className="mt-3 text-xs text-green-400 hover:text-green-300 underline"
              >
                Upload Another Image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;