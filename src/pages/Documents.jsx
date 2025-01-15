import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Loader2 } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import DocumentDetails from "../components/DocumentDetails";
import { uploadDocument, getDocuments } from "../services/document.service";

const DocumentSkeleton = () => (
  <div className="p-4 rounded-lg border border-gray-200 animate-pulse">
    <div className="flex items-center">
      <div className="w-5 h-5 bg-gray-200 rounded mr-3" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="w-16 h-6 bg-gray-200 rounded-full" />
    </div>
  </div>
);

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingUpload, setProcessingUpload] = useState(false);
  const pollTimeoutRef = useRef(null);
  const isPollingRef = useRef(false);
  const processingDocsRef = useRef(new Set());

  const stopPolling = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    isPollingRef.current = false;
    setProcessingUpload(false);
  }, []);

  const startPolling = useCallback(() => {
    if (isPollingRef.current || pollTimeoutRef.current) return;

    const poll = async () => {
      if (!isPollingRef.current) {
        isPollingRef.current = true;
        await fetchDocuments(true);
        isPollingRef.current = false;

        if (processingDocsRef.current.size > 0) {
          pollTimeoutRef.current = setTimeout(poll, 2000);
        } else {
          stopPolling();
        }
      }
    };

    poll();
  }, [stopPolling]);

  const fetchDocuments = useCallback(async (checkProcessing = false) => {
    try {
      if (!checkProcessing) {
        setLoading(true);
      }

      const docs = await getDocuments(checkProcessing);
      console.log("Fetched documents:", docs); // Debugging log

      if (Array.isArray(docs)) {
        setDocuments((prevDocs) => {
          const docsMap = new Map(prevDocs.map((doc) => [doc._id, doc]));

          docs.forEach((doc) => {
            docsMap.set(doc._id, {
              ...docsMap.get(doc._id),
              ...doc,
            });
          });

          const newDocs = Array.from(docsMap.values());
          console.log("Updated documents state:", newDocs); // Debugging log
          return newDocs;
        });

        const processingDocs = docs.filter((doc) => doc.status === "processing");
        processingDocsRef.current = new Set(processingDocs.map((doc) => doc._id));

        if (selectedDoc) {
          const updatedSelectedDoc = docs.find((doc) => doc._id === selectedDoc._id);
          if (updatedSelectedDoc && JSON.stringify(updatedSelectedDoc) !== JSON.stringify(selectedDoc)) {
            setSelectedDoc(updatedSelectedDoc);
          }
        }

        if (processingDocs.length > 0) {
          setProcessingUpload(true);
          if (!isPollingRef.current && !pollTimeoutRef.current) {
            startPolling();
          }
        } else {
          stopPolling();
        }
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError(err.response?.data?.message || "Failed to fetch documents");
    } finally {
      if (!checkProcessing) {
        setLoading(false);
      }
    }
  }, [selectedDoc, startPolling, stopPolling]);

  useEffect(() => {
    fetchDocuments();
    return () => stopPolling();
  }, [fetchDocuments, stopPolling]);

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    setError(null);

    try {
      for (const file of acceptedFiles) {
        const metadata = {
          name: file.name,
          type: file.type.includes("pdf") ? "pdf" : "other",
        };

        const document = await uploadDocument(file, metadata);
        console.log("Uploaded document:", document);

        await fetchDocuments(false);

        if (document && document._id) {
          setSelectedDoc(document);
          processingDocsRef.current.add(document._id);
          setProcessingUpload(true);

          if (!isPollingRef.current) {
            startPolling();
          }
        }
      }
    } catch (err) {
      setError("Failed to upload documents");
      console.error(err);
    } finally {
      setUploading(false);
    }
  }, [startPolling, fetchDocuments]);

  const handleDeleteDocument = useCallback(
    (documentId) => {
      setDocuments((prev) => {
        const newDocs = prev.filter((doc) => doc._id !== documentId);
        console.log("Documents after deletion:", newDocs); // Debugging log
        return newDocs;
      });
      if (selectedDoc?._id === documentId) {
        setSelectedDoc(null);
      }
      processingDocsRef.current.delete(documentId);
      if (processingDocsRef.current.size === 0) {
        stopPolling();
      }
    },
    [selectedDoc, stopPolling]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg"],
    },
  });

  return (
    <DashboardLayout>
      <div className="h-full flex">
        <div className="w-1/3 border-r">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
              <p className="mt-1 text-sm text-gray-600">
                Upload and manage your documents
              </p>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                {error}
              </div>
            )}

            <div
              {...getRootProps()}
              className={`p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-300 hover:border-primary-500"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center text-gray-600">
                <FileText className="w-8 h-8 mb-2 text-gray-400" />
                <p className="text-sm text-center">
                  {isDragActive
                    ? "Drop the files here..."
                    : "Drag & drop files here, or click to select"}
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {loading ? (
                <>
                  <DocumentSkeleton />
                  <DocumentSkeleton />
                  <DocumentSkeleton />
                </>
              ) : documents && documents.length > 0 ? (
                documents.map((doc) => (
                  doc && doc._id && (
                    <div
                      key={doc._id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                        selectedDoc?._id === doc._id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-primary-300"
                      }`}
                    >
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {doc.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <span
                            className={`px-2 py-1 text-xs rounded-full flex items-center ${
                              doc.status === "processed"
                                ? "bg-green-100 text-green-800"
                                : doc.status === "processing"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                ))
              ) : (
                <p className="text-sm text-gray-500">No documents found.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <DocumentDetails
            document={selectedDoc}
            onDelete={handleDeleteDocument}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Documents;