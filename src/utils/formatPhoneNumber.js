export const formatPhoneNumber = (value) => {
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '');
  
  // Return empty string if no digits
  if (!phoneNumber) return '';
  
  // Format as XXX-XXX-XXXX
  const formattedNumber = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  
  return formattedNumber;
};

export const validatePhoneNumber = (value) => {
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '');
  
  // Check if it's exactly 10 digits
  return phoneNumber.length === 10;
}; 