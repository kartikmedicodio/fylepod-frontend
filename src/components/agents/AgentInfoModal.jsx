import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';

const AgentInfoModal = ({ agent, agentInfo, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!agent) return null;

  // Stop propagation to prevent closing when clicking inside the modal
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        onClick={handleModalClick}
        className="fixed bottom-20 right-6 w-64 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white">
          <h3 className="font-medium">{agentInfo[agent].name}</h3>
          <p className="text-xs text-white/80">{agentInfo[agent].title}</p>
        </div>
        <div className="p-3">
          <div className="text-xs space-y-1">
            {agentInfo[agent].capabilities.map((capability, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                <span className="text-gray-600">{capability}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

AgentInfoModal.propTypes = {
  agent: PropTypes.string,
  agentInfo: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired
};

export default AgentInfoModal; 