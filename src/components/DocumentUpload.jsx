import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

const DocumentUpload = ({ onUpload }) => {
  const onDrop = useCallback((acceptedFiles) => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div 
      {...getRootProps()} 
      className={`p-6 mb-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors
        ${isDragActive 
          ? 'border-primary-500 bg-primary-50' 
          : 'border-gray-300 hover:border-primary-500'
        }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center text-gray-600">
        <Upload className="w-8 h-8 mb-2 text-gray-400" />
        <p className="text-sm text-center">
          {isDragActive
            ? "Drop the files here..."
            : "Drag & drop files here, or click to select"}
        </p>
      </div>
    </div>
  );
};

export default DocumentUpload; 