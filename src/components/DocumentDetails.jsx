import { useState, useEffect } from "react";
import { FileText, Download, Loader2, Trash2 } from "lucide-react";
import { downloadDocument, deleteDocument } from "../services/document.service";

const DocumentDetails = ({ document: initialDocument, onDelete }) => {
  const [document, setDocument] = useState(initialDocument);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (JSON.stringify(document) !== JSON.stringify(initialDocument)) {
      setDocument(initialDocument);
    }
  }, [initialDocument]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      setDeleting(true);
      await deleteDocument(document._id);
      onDelete(document._id);
    } catch (err) {
      setError("Failed to delete document");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      await downloadDocument(document._id);
    } catch (err) {
      setError("Failed to download document");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!document) {
    return (
      <div className="p-6 flex items-center justify-center text-gray-500">
        Select a document to view details
      </div>
    );
  }

  const renderExtractedData = (data) => {
    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return Object.entries(data).map(([key, value]) => {
      // Handle nested objects (like passport data)
      if (typeof value === 'object' && value !== null) {
        return (
          <div key={key} className="space-y-4">
            <h4 className="text-sm font-medium text-gray-700 capitalize">
              {key.replace(/_/g, " ")}
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(value).map(([subKey, subValue]) => (
                <div
                  key={`${key}-${subKey}`}
                  className="bg-white p-4 rounded-lg border border-gray-200"
                >
                  <p className="text-sm text-gray-500 capitalize">
                    {subKey.replace(/_/g, " ")}
                  </p>
                  <p className="font-medium">{String(subValue) || "N/A"}</p>
                </div>
              ))}
            </div>
          </div>
        );
      }

      return (
        <div
          key={key}
          className="bg-white p-4 rounded-lg border border-gray-200"
        >
          <p className="text-sm text-gray-500 capitalize">
            {key.replace(/_/g, " ")}
          </p>
          <p className="font-medium">{String(value) || "N/A"}</p>
        </div>
      );
    });
  };

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Document Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-gray-400" />
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {document.originalname || document.name || 'Untitled Document'}
              </h2>
              <p className="text-sm text-gray-500">
                {new Date(document.createdAt || document.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </button>
          </div>
        </div>

        {/* Processing Status */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700">Processing Status</h3>
          <div className="flex items-center">
            <div
              className={`h-2 flex-1 rounded-full ${
                document.status === "processed"
                  ? "bg-green-500"
                  : document.status === "processing"
                  ? "bg-yellow-500 animate-pulse"
                  : document.status === "failed"
                  ? "bg-red-500"
                  : "bg-gray-200"
              }`}
            />
            <span className="ml-3 text-sm text-gray-600 capitalize">
              {document.status || 'pending'}
              {document.status === "failed" && document.error && (
                <span className="text-red-500 ml-2">({document.error})</span>
              )}
            </span>
          </div>
        </div>

        {/* Extracted Data */}
        {document.status === "processed" && document.extractedData && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Extracted Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {renderExtractedData(document.extractedData)}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentDetails; 