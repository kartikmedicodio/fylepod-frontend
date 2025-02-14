import { useState, useEffect } from 'react';
import { Download, AlertCircle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrganizedDocuments } from '../services/document.service';
import { PDFDocument } from 'pdf-lib';

const processingSteps = [
  { id: 1, text: "Analyzing document..." },
  { id: 2, text: "Organizing content..." },
  { id: 3, text: "Generating PDF..." }
];

const PDFGenerator = ({ managementId }) => {
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!loading) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % processingSteps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [loading]);

  // Function to load the template PDF and fill it with data
  const fillPDFTemplate = async (data) => {
    try {
      // Load the PDF template
      const templateUrl = '/templates/testing.pdf';
      const templateBytes = await fetch(templateUrl).then(res => res.arrayBuffer());
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(templateBytes);
      const form = pdfDoc.getForm();

      // Get all form fields to debug
      const fields = form.getFields();
      console.log('Available fields:', fields.map(f => f.getName()));

      try {
        // Fill the form fields with exact field names from the PDF
        form.getTextField('Name of the Applicant').setText(
          data?.processedInformation?.personalInfo?.firstName|| 'N/A'
        );
        
        // Details of Applicant section
        form.getTextField('Passport No').setText(data?.processedInformation?.passportDetails?.number || 'N/A');
        form.getTextField('Place of Issue').setText(data?.processedInformation?.passportDetails?.placeOfIssue || 'N/A');
        form.getTextField('Date of Issue').setText(data?.processedInformation?.passportDetails?.dateOfIssue || 'N/A');
        form.getTextField('Date of Expiry').setText(data?.processedInformation?.passportDetails?.dateOfExpiry || 'N/A');
        form.getTextField('Mobile Phone').setText(data?.processedInformation?.contactInfo?.cellNumber || 'N/A');
        form.getTextField('EMail Address').setText(data?.processedInformation?.contactInfo?.emailId || 'N/A');
        
        // Employment and Education section
        form.getTextField('Name of the Current Employer').setText(
          data?.processedInformation?.employment?.current?.companyName || 'Envision AESC Technology (Jiangsu) Co. Ltd.'
        );
        form.getTextField('Applicants current Designation role  position').setText(
          data?.processedInformation?.employment?.current?.position || 'N/A'
        );
        form.getTextField('Educational Qualification').setText(
          data?.processedInformation?.qualifications?.education || 'N/A'
        );
        form.getTextField('Specific details of Skills Experience').setText(
          `${data?.processedInformation?.employment?.current?.position}, ${data?.processedInformation?.employment?.previous?.position}` || 'N/A'
        );
        form.getTextField('Length of Applicants job experience').setText(
          `${data?.processedInformation?.qualifications?.totalExperience?.years} years ${data?.processedInformation?.qualifications?.totalExperience?.months} months` || 'N/A'
        );

      } catch (fieldError) {
        console.error('Error filling specific field:', fieldError);
        // Continue with other fields if one fails
      }

      // Save the filled PDF
      const pdfBytes = await pdfDoc.save();
      
      // Create a blob and download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document-summary-${managementId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error filling PDF:', err);
      throw err;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(managementId);
        const data = await getOrganizedDocuments(managementId);
        console.log(data);
        setDocumentData(data);
      } catch (err) {
        setError('Failed to fetch document data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (managementId) {
      fetchData();
    }
  }, [managementId]);

  const handleDownload = async () => {
    try {
      setLoading(true);
      await fillPDFTemplate(documentData);
    } catch (err) {
      setError('Failed to generate PDF');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 bg-blue-50 px-6 py-3 rounded-lg border border-blue-100"
      >
        <div className="relative">
          <div className="w-6 h-6">
            <motion.div
              className="absolute inset-0 border-2 border-blue-500 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-1 border-2 border-blue-300 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
        </div>
        
        <div className="flex flex-col">
          <motion.span 
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm font-medium text-blue-700"
          >
            {processingSteps[currentStep].text}
          </motion.span>
          <div className="flex gap-1 mt-1">
            {processingSteps.map((step, index) => (
              <motion.div
                key={step.id}
                className={`h-1 rounded-full ${
                  index === currentStep ? 'w-8 bg-blue-500' : 'w-2 bg-blue-200'
                }`}
                animate={{
                  width: index === currentStep ? 32 : 8,
                  backgroundColor: index === currentStep ? '#3B82F6' : '#BFDBFE'
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.button 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        disabled 
        className="flex items-center px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
      >
        <AlertCircle className="w-4 h-4 mr-2" />
        <span className="font-medium">Generation Failed</span>
      </motion.button>
    );
  }

  if (!documentData) {
    return null;
  }

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleDownload}
      className="flex items-center px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
    >
      <FileText className="w-4 h-4 mr-2" />
      <span className="font-medium">Download PDF</span>
    </motion.button>
  );
};

export default PDFGenerator;