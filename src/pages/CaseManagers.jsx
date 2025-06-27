import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Briefcase, Star, Bot, User, GraduationCap, Building2, Calendar, 
  Brain, Target, Workflow, Cog, CheckCircle2, Users, Sparkles } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';

const CaseManagers = () => {
  const [selectedManager, setSelectedManager] = useState(null);
  const [caseManagers, setCaseManagers] = useState([]);
  const [aiAgents, setAiAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map agent IDs to their avatar images
  const agentAvatars = {
    '1': '/assets/diana-avatar.png',  // Diana
    '2': '/assets/fiona-avatar.png',  // Fiona
    '3': '/assets/sophia-avatar.png'  // Sophia
  };

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await api.get('/agents');
        console.log('API Response:', response.data.data);
        if (response.data.success) {
          // Transform the API data to match our UI requirements
          const transformedAgents = response.data.data.map(agent => {
            const transformed = {
            id: agent.agentId,
            name: agent.name,
              role: 'AI Agent',
            avatarType: 'image',
            avatar: agentAvatars[agent.agentId],
            gradient: agent.gradient,
            glowColor: agent.name.toLowerCase(),
            initial: agent.name[0],
            location: 'Virtual',
            experience: 'AI-powered experience',
            specialization: agent.description,
            description: agent.description,
            bio: agent.description,
            achievements: agent.capabilities,
              status: agent.status,
              detailedDescription: agent.detailedDescription || {
                expertise: agent.expertise,
                approach: agent.approach,
                workStyle: agent.workStyle,
                specialFeatures: agent.specialFeatures || []
              },
              capabilities: agent.capabilities || []
            };
            console.log('Transformed Agent:', transformed);
            return transformed;
          });
          setAiAgents(transformedAgents);
          // If no manager is selected, select the first AI agent
          if (!selectedManager && transformedAgents.length > 0) {
            setSelectedManager(transformedAgents[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching AI agents:', err);
        toast.error('Failed to load AI agents');
      }
    };

    const fetchCaseManagers = async () => {
      try {
        const authUserStr = localStorage.getItem('auth_user');
        if (!authUserStr) {
          setError('User not authenticated');
          return;
        }

        const authUser = JSON.parse(authUserStr);
        const userLawfirmId = authUser.lawfirm_id?._id;

        if (!userLawfirmId) {
          setError('User not associated with any law firm');
          return;
        }

        const response = await api.get('/auth/attorneys');
        if (response.data.status === 'success') {
          const attorneys = response.data.data.attorneys
            .filter(attorney => attorney.lawfirm_id?._id === userLawfirmId)
            .map(attorney => ({
              id: attorney.id,
              name: attorney.name,
              role: attorney.role || 'Attorney',
              avatarType: attorney.avatarType,
              avatar: attorney.avatar,
              email: attorney.email,
              sex: attorney.sex,
              phone: attorney.phone,
              contact: attorney.contact,
              location: attorney.location,
              address: attorney.address,
              currentJob: attorney.currentJob,
              workHistory: attorney.workHistory,
              educationHistory: attorney.educationHistory,
              birthInfo: attorney.birthInfo,
              passport: attorney.passport,
              experience: attorney.experience,
              specialization: attorney.specialization,
              bio: attorney.bio,
              achievements: attorney.achievements,
              activeCases: attorney.activeCases,
              completedCases: attorney.completedCases,
              company_name: attorney.company_name,
              company_id: attorney.company_id,
              lawfirm_name: attorney.lawfirm_name,
              lawfirm_id: attorney.lawfirm_id
          }));

          setCaseManagers(attorneys);
        }
      } catch (err) {
        console.error('Error fetching case managers:', err);
        setError('Failed to load case managers');
        toast.error('Failed to load case managers');
      } finally {
        setLoading(false);
      }
    };

    Promise.all([fetchAgents(), fetchCaseManagers()]);
  }, []);

  const isAIAgent = (manager) => {
    return manager?.role === 'AI Agent';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading case managers...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Case Managers</h1>
      <div className="flex gap-6">
        {/* Left side - Case Manager Profiles */}
        <div className="w-[40%] bg-white rounded-lg shadow-lg backdrop-blur-sm">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Case Manager Profiles
            </h2>
          </div>
          <div className="divide-y">
            {/* AI Agents Section */}
            {aiAgents.map((manager) => (
              <div
                key={manager._id}
                className={`p-4 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-${manager.glowColor}-50 hover:to-purple-50 transform hover:scale-[1.02] ${
                  selectedManager?.id === manager.id ? `bg-gradient-to-r from-${manager.glowColor}-100 to-purple-100` : ''
                }`}
                onClick={() => setSelectedManager(manager)}
              >
                <div className="flex items-center space-x-4">
                  {manager.id === '3' ? (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white bg-gradient-to-r from-slate-700 to-zinc-800 shadow-lg">
                      {manager.name[0]}
                    </div>
                  ) : (
                    <img
                      src={manager.avatar}
                      alt={manager.name}
                      className="w-12 h-12 rounded-full shadow-lg transform hover:scale-105 transition-transform duration-200"
                    />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900 flex items-center">
                      {manager.name}
                      <span className="ml-2 px-2 py-0.5 text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full">
                        AI
                      </span>
                    </h3>
                  </div>
                </div>
              </div>
            ))}

            {/* Human Case Managers Section */}
            {caseManagers.map((manager) => (
              <div
                key={manager.id}
                className={`p-4 cursor-pointer transition-all duration-300 hover:bg-gray-50 transform hover:scale-[1.02] ${
                  selectedManager?.id === manager.id ? 'bg-gray-100' : ''
                }`}
                onClick={() => setSelectedManager(manager)}
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={manager.avatar}
                    alt={manager.name}
                    className="w-12 h-12 rounded-full shadow-md transition-transform duration-200 hover:scale-105"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">{manager.name}</h3>
                    <p className="text-sm text-gray-500">{manager.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Case Manager Details */}
        {selectedManager && (
          <div className="flex-1 bg-white rounded-lg shadow-lg backdrop-blur-sm">
            <div className="p-6 h-[calc(100vh-12rem)] overflow-y-auto">
              {/* Profile Header */}
              <div className="flex items-start space-x-6">
                {isAIAgent(selectedManager) ? (
                  selectedManager.id === '3' ? (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white bg-gradient-to-r from-slate-700 to-zinc-800 shadow-xl">
                    {selectedManager.name[0]}
                  </div>
                  ) : (
                    <img
                      src={selectedManager.avatar}
                      alt={selectedManager.name}
                      className="w-24 h-24 rounded-full shadow-xl"
                    />
                  )
                ) : (
                  <img
                    src={selectedManager.avatar}
                    alt={selectedManager.name}
                    className="w-24 h-24 rounded-full shadow-xl"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedManager.name}</h2>
                  <p className="text-lg text-gray-600">{selectedManager.title || selectedManager.role}</p>
                  <div className="mt-2 flex items-center space-x-4">
                    {selectedManager.location && (
                      <div className="flex items-center text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{selectedManager.location}</span>
                      </div>
                    )}
                    {selectedManager.experience && (
                      <div className="flex items-center text-gray-500">
                        <Briefcase className="w-4 h-4 mr-1" />
                        <span>{selectedManager.experience}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Agent Specific Sections */}
              {isAIAgent(selectedManager) && (
                <>
                  {/* Status Section */}
                  <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <CheckCircle2 className="w-5 h-5 mr-2 text-blue-600" />
                        Current Status
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500 mb-1">Status</span>
                            <p className="text-base font-medium text-gray-800">{selectedManager.status}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Bot className="w-5 h-5 mr-2 text-blue-600" />
                        About
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 mb-2">Description</span>
                          <p className="text-base text-gray-800 leading-relaxed">{selectedManager.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Description Section */}
                  <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Brain className="w-5 h-5 mr-2 text-blue-600" />
                        Expertise & Approach
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                          <div className="flex items-center mb-3">
                            <Target className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="text-base font-medium text-gray-900">Expertise</span>
                          </div>
                          <p className="text-base text-gray-800 pl-7">{selectedManager.detailedDescription?.expertise}</p>
                        </div>

                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                          <div className="flex items-center mb-3">
                            <Workflow className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="text-base font-medium text-gray-900">Approach</span>
                          </div>
                          <p className="text-base text-gray-800 pl-7">{selectedManager.detailedDescription?.approach}</p>
                        </div>

                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                          <div className="flex items-center mb-3">
                            <Users className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="text-base font-medium text-gray-900">Work Style</span>
                          </div>
                          <p className="text-base text-gray-800 pl-7">{selectedManager.detailedDescription?.workStyle}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Special Features Section */}
                  <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                        Special Features
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedManager.detailedDescription?.specialFeatures.map((feature, index) => (
                          <div key={index} className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                            <div className="flex items-start">
                              <Star className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                              <p className="text-base text-gray-800">{feature}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Capabilities Section */}
                  <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Star className="w-5 h-5 mr-2 text-blue-600" />
                        Capabilities
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedManager.capabilities?.map((capability, index) => (
                          <div key={index} className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                            <div className="flex items-start">
                              <CheckCircle2 className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                              <p className="text-base text-gray-800">{capability}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
                 {/* Case Statistics Section */}
                 {!isAIAgent(selectedManager) && (
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <CheckCircle2 className="w-5 h-5 mr-2 text-blue-600" />
                      Case Statistics
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center mb-2">
                          <Users className="w-5 h-5 text-blue-600 mr-2" />
                          <h4 className="text-base font-medium text-gray-900">Active Cases</h4>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{selectedManager.activeCases || 0}</p>
                      </div>
                      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center mb-2">
                          <CheckCircle2 className="w-5 h-5 text-blue-600 mr-2" />
                          <h4 className="text-base font-medium text-gray-900">Completed Cases</h4>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{selectedManager.completedCases || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Professional Summary Section */}
              {!isAIAgent(selectedManager) && (
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Professional Summary
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 mb-1">Experience</span>
                          <p className="text-base font-medium text-gray-800">{selectedManager.experience}</p>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 mb-1">Specialization</span>
                          <p className="text-base font-medium text-gray-800">{selectedManager.specialization}</p>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500 mb-1">Professional Bio</span>
                        <p className="text-base text-gray-800 whitespace-pre-wrap">{selectedManager.bio}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information Section */}
              {!isAIAgent(selectedManager) && selectedManager.contact && (
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Phone className="w-5 h-5 mr-2 text-blue-600" />
                      Contact Information
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center">
                          <Mail className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Email</span>
                            <span className="text-base font-medium text-gray-800">{selectedManager.contact.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Phone className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Mobile</span>
                            <span className="text-base font-medium text-gray-800">{selectedManager.contact.mobileNumber}</span>
                          </div>
                        </div>
                        {selectedManager.contact.residencePhone && (
                          <div className="flex items-center">
                            <Phone className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500">Residence</span>
                              <span className="text-base font-medium text-gray-800">{selectedManager.contact.residencePhone}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Information Section */}
              {!isAIAgent(selectedManager) && (selectedManager.birthInfo || selectedManager.passport) && (
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Personal Information
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {selectedManager.birthInfo && (
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                          <div className="flex items-center mb-4">
                            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                            <h4 className="text-base font-medium text-gray-900">Birth Information</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 mb-1">Date of Birth</span>
                              <p className="text-base font-medium text-gray-800">
                                {new Date(selectedManager.birthInfo.dateOfBirth).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 mb-1">Place of Birth</span>
                              <p className="text-base font-medium text-gray-800">
                                {`${selectedManager.birthInfo.cityOfBirth}, ${selectedManager.birthInfo.countryOfBirth}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {selectedManager.passport && (
                        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                          <div className="flex items-center mb-4">
                            <Briefcase className="w-5 h-5 text-blue-600 mr-2" />
                            <h4 className="text-base font-medium text-gray-900">Passport Details</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 mb-1">Passport Number</span>
                              <p className="text-base font-medium text-gray-800">{selectedManager.passport.number}</p>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 mb-1">Type</span>
                              <p className="text-base font-medium text-gray-800">{selectedManager.passport.passportType}</p>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 mb-1">Issued On</span>
                              <p className="text-base font-medium text-gray-800">
                                {new Date(selectedManager.passport.dateOfIssue).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 mb-1">Expires On</span>
                              <p className="text-base font-medium text-gray-800">
                                {new Date(selectedManager.passport.dateOfExpiry).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 mb-1">Place of Issue</span>
                              <p className="text-base font-medium text-gray-800">{selectedManager.passport.placeOfIssue}</p>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 mb-1">Issuing Authority</span>
                              <p className="text-base font-medium text-gray-800">{selectedManager.passport.issuedBy}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Address Section */}
              {!isAIAgent(selectedManager) && selectedManager.address && (
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                      Address
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 mb-1">Full Address</span>
                          <p className="text-base font-medium text-gray-800">
                            {[
                              selectedManager.address.floorAptSuite,
                              `${selectedManager.address.streetNumber} ${selectedManager.address.streetName}`,
                              selectedManager.address.district,
                              selectedManager.address.city,
                              selectedManager.address.stateProvince,
                              selectedManager.address.country,
                              selectedManager.address.zipCode
                            ].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Work Experience - Only for human case managers */}
              {!isAIAgent(selectedManager) && selectedManager.currentJob && (
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                      Current Position
                  </h3>
                  </div>
                  <div className="p-6">
                    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 mb-1">Job Title</span>
                          <p className="text-base font-medium text-gray-800">{selectedManager.currentJob.jobTitle}</p>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 mb-1">Company</span>
                          <p className="text-base font-medium text-gray-800">{selectedManager.currentJob.companyName}</p>
                        </div>
                        {selectedManager.currentJob.companyAddress && (
                          <div className="flex flex-col col-span-2">
                            <span className="text-sm text-gray-500 mb-1">Office Address</span>
                            <p className="text-base font-medium text-gray-800">{selectedManager.currentJob.companyAddress}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Work History - Only for human case managers */}
              {!isAIAgent(selectedManager) && selectedManager.workHistory && selectedManager.workHistory.length > 0 && (
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
                    Work History
                  </h3>
                  </div>
                  <div className="p-6">
                  <div className="space-y-4">
                    {selectedManager.workHistory.map((work, index) => (
                        <div key={index} className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 mb-1">Position</span>
                              <p className="text-base font-medium text-gray-800">{work.jobTitle}</p>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 mb-1">Company</span>
                              <p className="text-base font-medium text-gray-800">{work.companyName}</p>
                            </div>
                            <div className="flex flex-col col-span-2">
                              <span className="text-sm text-gray-500 mb-1">Duration</span>
                              <p className="text-base font-medium text-gray-800">
                                {new Date(work.fromDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long'
                                })} - {
                                  work.toDate 
                                    ? new Date(work.toDate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long'
                                      })
                                    : 'Present'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                    ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Education - Only for human case managers */}
              {!isAIAgent(selectedManager) && selectedManager.educationHistory && selectedManager.educationHistory.length > 0 && (
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                    Education
                  </h3>
                  </div>
                  <div className="p-6">
                  <div className="space-y-4">
                    {selectedManager.educationHistory.map((edu, index) => (
                        <div key={index} className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 mb-1">Degree</span>
                              <p className="text-base font-medium text-gray-800">{edu.courseLevel} in {edu.specialization}</p>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 mb-1">Institution</span>
                              <p className="text-base font-medium text-gray-800">{edu.institution}</p>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 mb-1">GPA</span>
                              <p className="text-base font-medium text-gray-800">{edu.gpa}</p>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-500 mb-1">Graduation Year</span>
                              <p className="text-base font-medium text-gray-800">
                                {new Date(edu.passoutYear).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                  </div>
                </div>
              )}

              {/* Achievements Section */}
              {!isAIAgent(selectedManager) && selectedManager.achievements && selectedManager.achievements.length > 0 && (
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-blue-600" />
                      Achievements
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-4">
                      {selectedManager.achievements.map((achievement, index) => (
                        <div key={index} className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-5 transition-all duration-200 hover:shadow-md flex items-start">
                          <Star className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                          <p className="text-base text-gray-800">{achievement}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseManagers; 