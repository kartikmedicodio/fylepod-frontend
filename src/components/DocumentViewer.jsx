const DocumentViewer = ({ document }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{document.name}</h2>
        <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm">
          {document.type}
        </span>
      </div>
      <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
        <p className="text-gray-500">
          Document preview would appear here
        </p>
      </div>
    </div>
  );
};

export default DocumentViewer; 