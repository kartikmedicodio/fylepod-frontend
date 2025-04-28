import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ onCategorySelect }) => {
  const navigate = useNavigate();
  const [selectedItem, setSelectedItem] = useState('Process Template');

  const sidebarItems = [
    {
      id: 'pt',
      name: 'Process Template',
      category: 'Process Template'
    },
    {
      id: 'mdl',
      name: 'Master Document List',
      category: 'Master Document List'
    },
    {
      id: 'mfl',
      name: 'Master Forms List',
      category: 'Master Forms List'
    }
  ];

  const handleItemClick = (category) => {
    setSelectedItem(category);
    if (onCategorySelect) {
      onCategorySelect(category);
    } else {
      navigate('/knowledge', { state: { selectedCategory: category } });
    }
  };

  return (
    <div className="w-64 bg-white shadow-sm rounded-lg h-fit">
      <div className="p-4">
        {/* Knowledge Base Header */}
        <div className="px-4 py-2 mb-2 text-sm font-medium text-gray-900">
          Knowledge Base
        </div>
        
        {/* Navigation Items */}
        {sidebarItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.category)}
            className={`block w-full text-left px-4 py-2 rounded-lg text-sm mb-1 ${
              selectedItem === item.category
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  onCategorySelect: PropTypes.func
};

export default Sidebar; 