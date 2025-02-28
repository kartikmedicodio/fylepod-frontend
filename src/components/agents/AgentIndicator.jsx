import PropTypes from 'prop-types';
import { useState } from 'react';
import AgentInfoModal from './AgentInfoModal';
import { AGENT_INFO } from '../../constants/agentInfo';

const AgentIndicator = ({ onAgentClick }) => {
  const [selectedAgent, setSelectedAgent] = useState(null);

  const handleAgentClick = (agent) => {
    setSelectedAgent(selectedAgent === agent ? null : agent);
    onAgentClick(agent);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-pink-600/90 rounded-full px-4 py-1.5 text-white shadow-sm border border-white/20">
        <div className="flex items-center">
          <span className="relative flex h-2 w-2 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-medium">2 agents active</span>
        </div>
        <div className="h-4 w-px bg-white/20"></div>
        <div className="flex -space-x-1">
          <button 
            onClick={() => handleAgentClick('diana')}
            className="relative group"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-xs font-medium border-2 border-white hover:scale-110 transition-transform">
              D
            </div>
          </button>
          <button
            onClick={() => handleAgentClick('fiona')} 
            className="relative group"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-xs font-medium border-2 border-white hover:scale-110 transition-transform">
              F
            </div>
          </button>
        </div>
      </div>

      <AgentInfoModal 
        agent={selectedAgent}
        agentInfo={AGENT_INFO}
        onClose={() => setSelectedAgent(null)}
      />
    </div>
  );
};

AgentIndicator.propTypes = {
  onAgentClick: PropTypes.func.isRequired
};

export default AgentIndicator; 