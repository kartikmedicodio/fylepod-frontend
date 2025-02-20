import React, { useState } from 'react';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EmployeeList = ({ employees = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleEmployeeClick = (employeeId) => {
    navigate(`employee/${employeeId}`);
  };

  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header with Search and Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search employees..."
              className="w-[400px] pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters Button */}
          <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 text-sm hover:bg-gray-50">
            <SlidersHorizontal size={16} />
            All Filters
          </button>
          <button className="px-4 py-2 border border-gray-200 rounded-lg flex items-center gap-2 text-sm hover:bg-gray-50">
            Sort
          </button>
        </div>

        {/* Add New Employee Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Plus size={16} />
          Add New Employee
        </button>
      </div>

      {/* Employee Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-800">Employee ID</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-800">Employee Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-800">Queries Pending</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee, index) => (
              <tr 
                key={employee.id} 
                className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer
                  ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                onClick={() => handleEmployeeClick(employee.id)}
              >
                <td className="px-6 py-3 text-sm text-gray-600">{employee.id.substring(0, 8)}</td>
                <td className="px-6 py-3 text-sm text-gray-800">{employee.name}</td>
                <td className="px-6 py-3 text-sm text-gray-600">{employee.queriesPending || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <div className="text-sm text-gray-600">
            Showing 1 - {filteredEmployees.length} of {filteredEmployees.length}
          </div>
          <div className="text-sm text-gray-600">
            Page 1 of {Math.ceil(filteredEmployees.length / 10)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeList; 