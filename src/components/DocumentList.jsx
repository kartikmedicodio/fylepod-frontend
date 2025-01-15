import { FileText, File, FileCheck } from 'lucide-react';

const getIconForType = (type) => {
  switch (type) {
    case 'passport':
      return <File className="w-5 h-5" />;
    case 'work_permit':
      return <FileCheck className="w-5 h-5" />;
    default:
      return <FileText className="w-5 h-5" />;
  }
};

const DocumentList = ({ documents, onSelect, selected }) => {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-semibold mb-4">Documents</h2>
      {documents.map((doc) => (
        <div
          key={doc.id}
          onClick={() => onSelect(doc)}
          className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors
            ${selected?.id === doc.id 
              ? 'bg-primary-50 border border-primary-200' 
              : 'hover:bg-gray-50'
            }`}
        >
          <div className="text-gray-500 mr-3">
            {getIconForType(doc.type)}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">{doc.name}</h3>
            <p className="text-xs text-gray-500">
              Uploaded on {doc.uploadedAt}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DocumentList; 