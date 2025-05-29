import React, { useState } from 'react';
import { Mail, Phone, MapPin, Briefcase, Star } from 'lucide-react';

// Agent case managers with gradient avatars and descriptions
const agentManagers = [
  {
    id: 'diana',
    name: 'Diana',
    role: 'AI Agent',
    avatarType: 'gradient',
    gradient: 'from-blue-400 to-purple-400',
    initial: 'D',
    email: 'diana@fylepod.com',
    phone: '-',
    location: 'Virtual',
    experience: 'AI-powered',
    specialization: 'Document Automation',
    bio: 'Diana is your intelligent document specialist. She can automatically identify and extract information from a wide variety of documents, ensuring accuracy and efficiency. With advanced validation and cross-verification capabilities, Diana helps reduce manual errors and speeds up your workflow.',
    achievements: [
      'Auto-identify documents',
      'Extract data',
      'Smart validations',
      'Cross verification'
    ],
    activeCases: 12,
    completedCases: 13
  },
  {
    id: 'fiona',
    name: 'Fiona',
    role: 'AI Agent',
    avatarType: 'gradient',
    gradient: 'from-purple-400 to-pink-400',
    initial: 'F',
    email: 'fiona@fylepod.com',
    phone: '-',
    location: 'Virtual',
    experience: 'AI-powered',
    specialization: 'Case Initiation & Automation',
    bio: 'Fiona is your process automation expert. She initiates new cases, creates tailored document checklists, and analyzes requirements to ensure nothing is missed. Fiona streamlines complex processes, making onboarding and case management smooth and hassle-free.',
    achievements: [
      'Case initiation',
      'Document checklist creation',
      'Requirements analysis',
      'Process automation'
    ],
    activeCases: 11,
    completedCases: 12
  },
  {
    id: 'sophia',
    name: 'Sophia',
    role: 'AI Agent',
    avatarType: 'gradient',
    gradient: 'from-slate-600 to-zinc-700',
    initial: 'S',
    email: 'sophia@fylepod.com',
    phone: '-',
    location: 'Virtual',
    experience: 'AI-powered',
    specialization: 'Case Support & Assistance',
    bio: 'Sophia is your real-time support agent. She answers your case-related questions, provides instant status updates, and guides you through every step of the process. Sophia ensures you always have the information and assistance you need, right when you need it.',
    achievements: [
      'Answer case questions',
      'Provide status updates',
      'Guide through processes',
      'Real-time assistance'
    ],
    activeCases: 13,
    completedCases: 14
  }
];

// Existing dummy case managers
const caseManagers = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Senior Case Manager',
    avatar: 'https://ui-avatars.com/api/?name=SJ&background=808080&color=fff',
    avatarType: 'image',
    email: 'sarah.johnson@fylepod.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    experience: '8 years',
    specialization: 'Corporate Immigration',
    bio: 'Sarah is a seasoned case manager with extensive experience in corporate immigration law. She has successfully managed over 500 cases and maintains a 98% success rate.',
    achievements: [
      'Top Performer 2023',
      'Excellence in Client Service Award',
      'Certified Immigration Specialist'
    ],
    activeCases: 12,
    completedCases: 14
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Case Manager',
    avatar: 'https://ui-avatars.com/api/?name=MC&background=808080&color=fff',
    avatarType: 'image',
    email: 'michael.chen@fylepod.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    experience: '5 years',
    specialization: 'Family Immigration',
    bio: 'Michael specializes in family-based immigration cases. His attention to detail and compassionate approach has helped numerous families reunite in the United States.',
    achievements: [
      'Rising Star Award 2022',
      'Client Satisfaction Award',
      'Family Immigration Specialist'
    ],
    activeCases: 10,
    completedCases: 13
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Senior Case Manager',
    avatar: 'https://ui-avatars.com/api/?name=ER&background=808080&color=fff',
    avatarType: 'image',
    email: 'emily.rodriguez@fylepod.com',
    phone: '+1 (555) 345-6789',
    location: 'Miami, FL',
    experience: '7 years',
    specialization: 'Business Immigration',
    bio: 'Emily is an expert in business immigration cases, particularly focusing on investor visas and business expansion cases. She has a strong track record of successful EB-5 applications.',
    achievements: [
      'Business Immigration Expert',
      'Top Revenue Generator 2023',
      'Leadership Excellence Award'
    ],
    activeCases: 15,
    completedCases: 11
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'Case Manager',
    avatar: 'https://ui-avatars.com/api/?name=DK&background=808080&color=fff',
    avatarType: 'image',
    email: 'david.kim@fylepod.com',
    phone: '+1 (555) 456-7890',
    location: 'Los Angeles, CA',
    experience: '4 years',
    specialization: 'Student Visas',
    bio: 'David specializes in student visa applications and has helped hundreds of international students successfully navigate the F-1 visa process.',
    achievements: [
      'Student Visa Specialist',
      'Client Service Excellence',
      'Rising Star 2023'
    ],
    activeCases: 11,
    completedCases: 12
  }
];

const allManagers = [...agentManagers, ...caseManagers];

const CaseManagers = () => {
  const [selectedManager, setSelectedManager] = useState([...agentManagers, ...caseManagers][0]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Case Managers</h1>
      <div className="flex gap-6">
        {/* Left side - Case Manager Profiles */}
        <div className="w-[40%] bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Case Manager Profiles</h2>
          </div>
          <div className="divide-y">
            {/* AI Agents Section */}
            <div className="pt-4 pb-2 px-4 bg-blue-50/40">
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">AI Agents</h3>
            </div>
            {agentManagers.map((manager) => (
              <div
                key={manager.id}
                className={`p-4 cursor-pointer transition-colors duration-200 hover:bg-blue-50 ${
                  selectedManager.id === manager.id ? 'bg-blue-100' : ''
                }`}
                onClick={() => setSelectedManager(manager)}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white bg-gradient-to-r ${manager.gradient}`}
                  >
                    {manager.initial}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{manager.name}</h3>
                    <p className="text-sm text-gray-500">{manager.role}</p>
                  </div>
                </div>
              </div>
            ))}
            {/* Human Case Managers Section */}
            <div className="pt-4 pb-2 px-4 bg-gray-50/60 border-t border-gray-200">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Human Case Managers</h3>
            </div>
            {caseManagers.map((manager) => (
              <div
                key={manager.id}
                className={`p-4 cursor-pointer transition-colors duration-200 hover:bg-gray-50 ${
                  selectedManager.id === manager.id ? 'bg-gray-100' : ''
                }`}
                onClick={() => setSelectedManager(manager)}
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={manager.avatar}
                    alt={manager.name}
                    className="w-12 h-12 rounded-full"
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
        <div className="flex-1 bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-start space-x-6">
              {selectedManager.avatarType === 'gradient' ? (
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold text-white bg-gradient-to-r ${selectedManager.gradient}`}
                >
                  {selectedManager.initial}
                </div>
              ) : (
                <img
                  src={selectedManager.avatar}
                  alt={selectedManager.name}
                  className="w-24 h-24 rounded-full"
                />
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedManager.name}</h2>
                <p className="text-lg text-gray-600">{selectedManager.role}</p>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="flex items-center text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{selectedManager.location}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Briefcase className="w-4 h-4 mr-1" />
                    <span>{selectedManager.experience} experience</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-5 h-5 mr-2" />
                  <span>{selectedManager.email}</span>
                </div>
                {selectedManager.avatarType !== 'gradient' && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-5 h-5 mr-2" />
                    <span>{selectedManager.phone}</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Active Cases</h4>
                  <p className="text-2xl font-bold text-blue-600">{selectedManager.activeCases}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900">Completed Cases</h4>
                  <p className="text-2xl font-bold text-green-600">{selectedManager.completedCases}</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">About</h3>
              <p className="text-gray-600">{selectedManager.bio}</p>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Specialization</h3>
              <p className="text-gray-600">{selectedManager.specialization}</p>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Skills</h3>
              <div className="space-y-2">
                {selectedManager.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center text-gray-600">
                    <Star className="w-4 h-4 mr-2 text-yellow-400" />
                    <span>{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseManagers; 