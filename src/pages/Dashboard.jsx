import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { FileText, Users, ArrowUp, Clock, Upload, MessageSquare, FileUp } from 'lucide-react';
import { recentActivities } from '../data/dummyData';
import { useDropzone } from 'react-dropzone';

const statsCards = [
  {
    label: 'Total Documents',
    value: '125',
    change: '+12.5%',
    icon: FileText,
    color: 'blue'
  },
  {
    label: 'Processed Today',
    value: '23',
    change: '+5.3%',
    icon: ArrowUp,
    color: 'green'
  },
  {
    label: 'Active Users',
    value: '45',
    change: '+2.4%',
    icon: Users,
    color: 'purple'
  },
];

const getActivityIcon = (type) => {
  switch (type) {
    case 'upload':
      return <Upload className="h-4 w-4 text-blue-500" />;
    case 'process':
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    case 'chat':
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    month: 'short',
    day: 'numeric'
  }).format(date);
};

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState('today');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const navigate = useNavigate();

  const simulateFileUpload = async (file) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress > 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: Math.min(progress, 100)
        }));
      }, 500);
    });
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    
    // Initialize progress for each file
    const initialProgress = {};
    acceptedFiles.forEach(file => {
      initialProgress[file.name] = 0;
    });
    setUploadProgress(initialProgress);

    // Simulate upload for each file
    await Promise.all(acceptedFiles.map(file => simulateFileUpload(file)));

    // Wait a moment to show 100% completion
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setUploading(false);
    navigate('/documents', { state: { files: acceptedFiles } });
  }, [navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div>
            {/* <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1> */}
            {/* <p className="text-gray-500">Welcome back to SecureDoc</p> */}
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-300 hover:border-primary-400'
              }
              ${uploading ? 'pointer-events-none' : ''}
            `}
          >
            <input {...getInputProps()} />
            <FileUp className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-900">
              {uploading ? 'Uploading documents...' : 'Drop your documents here'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {uploading ? 'Please wait while we process your files' : 'or click to select files'}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Supports PDF, PNG, JPG
            </p>
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-4 space-y-3">
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="space-y-1">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{fileName}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {statsCards.map((card) => (
            <div
              key={card.label}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <card.icon className={`h-6 w-6 text-${card.color}-500`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.label}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {card.value}
                        </div>
                        <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                          {card.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.user}
                      <span className="text-gray-500">
                        {' '}
                        {activity.type === 'upload' && 'uploaded'}
                        {activity.type === 'process' && 'processed'}
                        {activity.type === 'chat' && 'chatted about'}
                        {' '}
                        <span className="font-medium text-gray-900">{activity.document}</span>
                      </span>
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard; 