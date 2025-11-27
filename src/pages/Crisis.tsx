
import { 
  Phone, 
  MessageCircle, 
  Heart, 
  Shield, 
  Users,
  Clock,
  MapPin,
  Headphones,
  Video
} from 'lucide-react';

const crisisResources = [
  {
    name: '988 Suicide & Crisis Lifeline',
    description: '24/7 free and confidential support for people in distress',
    phone: '988',
    availability: '24/7',
    type: 'crisis',
    color: 'bg-red-50 border-red-200'
  },
  {
    name: 'Crisis Text Line',
    description: 'Text-based crisis support',
    phone: 'Text HOME to 741741',
    availability: '24/7',
    type: 'text',
    color: 'bg-blue-50 border-blue-200'
  },
  {
    name: 'SAMHSA National Helpline',
    description: 'Treatment referral and information service',
    phone: '1-800-662-4357',
    availability: '24/7',
    type: 'support',
    color: 'bg-green-50 border-green-200'
  },
  {
    name: 'National Domestic Violence Hotline',
    description: 'Support for domestic violence situations',
    phone: '1-800-799-7233',
    availability: '24/7',
    type: 'safety',
    color: 'bg-purple-50 border-purple-200'
  }
];

const localResources = [
  {
    name: 'Metro Mental Health Crisis Center',
    address: '123 Main Street, Your City',
    phone: '(555) 123-4567',
    hours: '24/7 Walk-in Crisis Services',
    services: ['Crisis Intervention', 'Emergency Assessment', 'Safety Planning']
  },
  {
    name: 'City General Hospital - Behavioral Health',
    address: '456 Health Blvd, Your City',
    phone: '(555) 987-6543',
    hours: '24/7 Emergency Department',
    services: ['Psychiatric Emergency', 'Crisis Stabilization', 'Inpatient Care']
  }
];

const selfCareStrategies = [
  {
    title: 'Grounding Techniques',
    description: '5-4-3-2-1 technique: Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste',
    icon: Shield
  },
  {
    title: 'Breathing Exercise',
    description: 'Box breathing: Inhale for 4, hold for 4, exhale for 4, hold for 4. Repeat 4-6 times',
    icon: Heart
  },
  {
    title: 'Safe Person Contact',
    description: 'Reach out to a trusted friend, family member, or mental health professional',
    icon: Users
  },
  {
    title: 'Create Physical Safety',
    description: 'Remove or distance yourself from any means of self-harm. Go to a safe location',
    icon: Shield
  }
];

export default function Crisis() {
  return (
    <div className="space-y-8">
      {/* Emergency Alert */}
      <div className="bg-red-600 text-white rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Phone className="h-8 w-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Crisis Support</h1>
              <p className="text-red-100">Immediate help is available 24/7</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-red-100 text-sm">Emergency?</p>
            <p className="text-2xl font-bold">911</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="bg-red-500 hover:bg-red-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center">
            <Phone className="h-5 w-5 mr-2" />
            Call 988 - Crisis Lifeline
          </button>
          <button className="bg-red-500 hover:bg-red-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 mr-2" />
            Text HOME to 741741
          </button>
        </div>
      </div>

      {/* Immediate Coping Strategies */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <Heart className="h-6 w-6 text-indigo-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Immediate Coping Strategies</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {selfCareStrategies.map((strategy, index) => (
            <div key={index} className="bg-indigo-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-indigo-100 rounded-lg p-2">
                  <strategy.icon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{strategy.title}</h3>
                  <p className="text-gray-700 text-sm">{strategy.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Crisis Hotlines */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">24/7 Crisis Support</h2>
        
        <div className="grid gap-4">
          {crisisResources.map((resource, index) => (
            <div key={index} className={`border-2 rounded-lg p-4 ${resource.color}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">{resource.name}</h3>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{resource.availability}</span>
                </div>
              </div>
              
              <p className="text-gray-700 text-sm mb-3">{resource.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {resource.type === 'text' ? (
                    <MessageCircle className="h-4 w-4 text-gray-500 mr-2" />
                  ) : (
                    <Phone className="h-4 w-4 text-gray-500 mr-2" />
                  )}
                  <span className="font-mono font-semibold text-gray-900">
                    {resource.phone}
                  </span>
                </div>
                
                <button className="bg-white text-gray-700 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-300">
                  {resource.type === 'text' ? 'Send Text' : 'Call Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Local Resources */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <MapPin className="h-6 w-6 text-indigo-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Local Crisis Centers</h2>
        </div>
        
        <div className="space-y-4">
          {localResources.map((resource, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{resource.name}</h3>
                  <p className="text-gray-600 text-sm flex items-center mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {resource.address}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-gray-900">{resource.phone}</p>
                  <p className="text-xs text-gray-500">{resource.hours}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {resource.services.map((service, serviceIndex) => (
                  <span
                    key={serviceIndex}
                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Online Support */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-6">
          <Video className="h-6 w-6 text-indigo-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Online Support Options</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Crisis Chat</h3>
            <p className="text-sm text-gray-600 mb-3">Live chat with trained counselors</p>
            <button className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
              Start Chat
            </button>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <Headphones className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Virtual Support Groups</h3>
            <p className="text-sm text-gray-600 mb-3">Connect with others who understand</p>
            <button className="w-full bg-green-600 text-white font-medium py-2 rounded-lg hover:bg-green-700 transition-colors duration-200">
              Join Group
            </button>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <Video className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">Telehealth Crisis</h3>
            <p className="text-sm text-gray-600 mb-3">Video sessions with therapists</p>
            <button className="w-full bg-purple-600 text-white font-medium py-2 rounded-lg hover:bg-purple-700 transition-colors duration-200">
              Schedule Now
            </button>
          </div>
        </div>
      </div>

      {/* Safety Plan */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Shield className="h-6 w-6 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800 mb-2">Create a Safety Plan</h3>
            <p className="text-yellow-700 text-sm mb-4">
              A safety plan is a personalized, practical plan to stay safe during difficult times. 
              It includes your warning signs, coping strategies, people you can contact, and ways to create a safe environment.
            </p>
            <button className="bg-yellow-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors duration-200">
              Create Your Safety Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}