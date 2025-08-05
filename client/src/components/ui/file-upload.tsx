import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isUploading?: boolean;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
}

export default function FileUpload({ 
  onFilesSelected, 
  isUploading = false, 
  accept = "application/pdf",
  multiple = true,
  maxSize = 10 * 1024 * 1024 // 10MB
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      [accept]: [".pdf"]
    },
    multiple,
    maxSize,
    disabled: isUploading,
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
      setSelectedFiles([]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-slate-300 hover:border-primary/50"
        } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="mx-auto w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <CloudUpload className="w-6 h-6 text-slate-500" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          {isDragActive ? "Drop your PDFs here" : "Drop your PDFs here"}
        </h3>
        <p className="text-slate-600 mb-4">or click to browse files</p>
        <p className="text-sm text-slate-500">
          Supports: Property listings, contracts, appraisals, inspection reports
        </p>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">Some files were rejected:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name}>
                {file.name}: {errors.map(e => e.message).join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-900">Selected Files:</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
          
          <Button
            onClick={handleUpload}
            disabled={isUploading || selectedFiles.length === 0}
            className="w-full"
          >
            {isUploading ? "Uploading..." : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      )}
    </div>
  );
}
