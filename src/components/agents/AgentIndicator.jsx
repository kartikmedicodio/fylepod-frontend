import PropTypes from 'prop-types';

const AgentIndicator = ({ onAgentClick }) => {
  return (
    <div className="fixed bottom-6 right-6 flex items-center space-x-3 bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-pink-600/90 rounded-full px-4 py-2 text-white shadow-lg backdrop-blur-sm border border-white/20">
      <div className="flex items-center">
        <span className="relative flex h-2 w-2 mr-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-sm font-medium">2 agents active</span>
      </div>
      <div className="h-4 w-px bg-white/20"></div>
      <div className="flex -space-x-1">
        <button 
          onClick={() => onAgentClick('diana')}
          className="relative group"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-xs font-medium border-2 border-white hover:scale-110 transition-transform">
            D
          </div>
        </button>
        <button
          onClick={() => onAgentClick('fiona')} 
          className="relative group"
        >
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center text-xs font-medium border-2 border-white hover:scale-110 transition-transform">
            F
          </div>
        </button>
      </div>
    </div>
  );
};

AgentIndicator.propTypes = {
  onAgentClick: PropTypes.func.isRequired
};

export default AgentIndicator; 