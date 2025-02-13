import { useState, useEffect } from 'react';
import { Download, Loader2, AlertCircle } from 'lucide-react';
import { getOrganizedDocuments } from '../services/document.service';
import { PDFDocument } from 'pdf-lib';

const PDFGenerator = ({ managementId }) => {
  const [documentData, setDocumentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      <button disabled className="flex items-center px-4 py-2 bg-gray-100 text-gray-400 rounded-lg">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading...
      </button>
    );
  }

  if (error) {
    return (
      <button disabled className="flex items-center px-4 py-2 bg-red-50 text-red-500 rounded-lg">
        <AlertCircle className="w-4 h-4 mr-2" />
        Error loading PDF
      </button>
    );
  }

  if (!documentData) {
    return null;
  }

  return (
    <button
      onClick={handleDownload}
      className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
    >
      <Download className="w-4 h-4 mr-2" />
      Download PDF
    </button>
  );
};

export default PDFGenerator;