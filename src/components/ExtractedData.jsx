const ExtractedData = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">No extracted data available</p>
      </div>
    );
  }

  const renderValue = (value) => {
    if (value === null || value === undefined) {
      return "N/A";
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const renderField = (key, value) => {
    return (
      <div key={key} className="border rounded-lg p-3">
        <p className="text-sm text-gray-500 capitalize">
          {key.replace(/([A-Z])/g, ' $1').trim()}
        </p>
        <p className="font-medium">
          {renderValue(value)}
        </p>
      </div>
    );
  };

  const renderNestedData = (data) => {
    return Object.entries(data).map(([key, value]) => {
      // If value is an object and not null, render it recursively
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return (
          <div key={key} className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(value).map(([subKey, subValue]) => 
                renderField(subKey, subValue)
              )}
            </div>
          </div>
        );
      }
      
      // Otherwise render as a regular field
      return renderField(key, value);
    });
  };

  try {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Extracted Information</h2>
        <div className="grid grid-cols-2 gap-4">
          {renderNestedData(data)}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering extracted data:', error);
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-500 text-center">
          <p>Error displaying extracted data</p>
          <p className="text-sm mt-2">Please try again later</p>
        </div>
      </div>
    );
  }
};

export default ExtractedData; 