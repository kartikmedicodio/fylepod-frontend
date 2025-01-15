export const documentTypes = {
  PASSPORT: 'passport',
  VISA: 'visa',
  WORK_PERMIT: 'work_permit',
  EDUCATION_CERT: 'education_certificate',
};

// Dummy users data
export const dummyUsers = [
  {
    id: 1,
    email: 'admin@securedoc.com',
    password: 'admin123', // In real app, this would be hashed
    name: 'Admin User',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0062ff&color=fff',
  },
  {
    id: 2,
    email: 'user@securedoc.com',
    password: 'user123',
    name: 'Demo User',
    role: 'user',
    avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=00a76f&color=fff',
  }
];

// Dummy documents data
export const dummyDocuments = [
  {
    id: 1,
    name: 'passport.pdf',
    type: documentTypes.PASSPORT,
    uploadedAt: '2024-03-15',
    size: '2.4 MB',
    status: 'processed',
    extractedData: {
      fullName: 'John Doe',
      passportNumber: 'A1234567',
      dateOfBirth: '1990-01-01',
      expiryDate: '2029-01-01',
      nationality: 'United States',
      issueDate: '2019-01-01',
    },
  },
  {
    id: 2,
    name: 'work_permit.pdf',
    type: documentTypes.WORK_PERMIT,
    uploadedAt: '2024-03-14',
    size: '1.8 MB',
    status: 'processed',
    extractedData: {
      permitNumber: 'WP123456',
      validUntil: '2025-12-31',
      employer: 'Tech Corp',
      position: 'Software Engineer',
      issueDate: '2023-01-01',
    },
  },
  {
    id: 3,
    name: 'visa_application.pdf',
    type: documentTypes.VISA,
    uploadedAt: '2024-03-13',
    size: '3.1 MB',
    status: 'processing',
    extractedData: {
      applicationType: 'Tourist Visa',
      applicationNumber: 'V789012',
      destination: 'United Kingdom',
      duration: '6 months',
      submissionDate: '2024-03-13',
    },
  }
];

export const dummyChat = [
  {
    id: 1,
    role: 'user',
    content: 'When does my passport expire?',
    timestamp: '2024-03-15T10:30:00Z',
  },
  {
    id: 2,
    role: 'assistant',
    content: 'Based on your passport document, your passport expires on January 1st, 2029.',
    timestamp: '2024-03-15T10:30:01Z',
  },
  {
    id: 3,
    role: 'user',
    content: 'What is my work permit number?',
    timestamp: '2024-03-15T10:31:00Z',
  },
  {
    id: 4,
    role: 'assistant',
    content: 'Your work permit number is WP123456, valid until December 31st, 2025.',
    timestamp: '2024-03-15T10:31:01Z',
  },
];

// Recent activity data
export const recentActivities = [
  {
    id: 1,
    type: 'upload',
    document: 'passport.pdf',
    user: 'Demo User',
    timestamp: '2024-03-15T10:00:00Z',
  },
  {
    id: 2,
    type: 'process',
    document: 'work_permit.pdf',
    user: 'System',
    timestamp: '2024-03-14T15:30:00Z',
  },
  {
    id: 3,
    type: 'chat',
    document: 'passport.pdf',
    user: 'Demo User',
    timestamp: '2024-03-14T09:15:00Z',
  },
]; 