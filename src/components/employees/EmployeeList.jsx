import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmployeeList = ({ employees }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleEmployeeClick = (employeeId) => {
    navigate(`employee/${employeeId}`);
  };

  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search employees..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                     focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
                     transition-all duration-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed"
            disabled
            title="This feature is coming soon"
          >
            All Filters
          </button>
          <button 
            className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-medium text-gray-400 cursor-not-allowed"
            disabled
            title="This feature is coming soon"
          >
            Sort
          </button>
          <button 
            className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed flex items-center gap-2"
            disabled
            title="This feature is coming soon"
          >
            Add New Employee
          </button>
        </div>
      </div>

      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee ID</th>
            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Employee Name</th>
          </tr>
        </thead>
        <tbody>
          {filteredEmployees.map(employee => (
            <tr 
              key={employee.id} 
              className="border-b border-gray-100 hover:bg-blue-50/50 cursor-pointer transition-colors"
              onClick={() => handleEmployeeClick(employee.id)}
            >
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{employee.id.substring(0, 8)}</td>
              <td className="px-6 py-4 text-sm text-gray-700">{employee.name}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No employees found matching your search.
        </div>
      )}

      <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
        <div>Showing {filteredEmployees.length} of {employees.length}</div>
        <div>Page 1 of 1</div>
      </div>
    </div>
  );
};

EmployeeList.propTypes = {
  employees: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired
};

export default EmployeeList; 