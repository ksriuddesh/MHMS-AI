import React, { useState } from 'react';
import { 
  MapPin, 
  Filter, 
  Star, 
  Calendar, 
  Phone, 
  Video,
  Shield,
  Globe,
  Clock
} from 'lucide-react';
import { useData, Provider } from '../contexts/DataContext';

const specialties = [
  'All Specialties',
  'Clinical Psychology',
  'Psychiatry',
  'Cognitive Behavioral Therapy',
  'Family Therapy',
  'Addiction Counseling',
  'Trauma Therapy',
  'Child Psychology'
];

const languages = [
  'All Languages',
  'English',
  'Spanish',
  'Mandarin',
  'French',
  'German'
];

export default function ProviderDirectory() {
  const { providers } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [selectedLanguage, setSelectedLanguage] = useState('All Languages');
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showInsuranceOnly, setShowInsuranceOnly] = useState(false);

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'All Specialties' || 
                           provider.specialty === selectedSpecialty;
    const matchesLanguage = selectedLanguage === 'All Languages' || 
                          provider.languages.includes(selectedLanguage);
    const matchesAvailable = !showOnlyAvailable || provider.available;
    const matchesInsurance = !showInsuranceOnly || provider.acceptsInsurance;

    return matchesSearch && matchesSpecialty && matchesLanguage && 
           matchesAvailable && matchesInsurance;
  });

  const ProviderCard = ({ provider }: { provider: Provider }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-4">
          <img
            src={provider.avatar}
            alt={provider.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{provider.name}</h3>
            <p className="text-gray-600 text-sm">{provider.specialty}</p>
            <div className="flex items-center mt-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-700 ml-1">
                {provider.rating}
              </span>
              <span className="text-sm text-gray-500 ml-1">(127 reviews)</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            provider.available 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {provider.available ? 'Available' : 'Busy'}
          </div>
          {provider.acceptsInsurance && (
            <div className="flex items-center text-xs text-green-600">
              <Shield className="h-3 w-3 mr-1" />
              Insurance
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center">
          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
          {provider.distance}
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-gray-400" />
          Next: {new Date(provider.nextAvailable).toLocaleDateString()}
        </div>
        <div className="flex items-center">
          <Globe className="h-4 w-4 mr-2 text-gray-400" />
          {provider.languages.join(', ')}
        </div>
        <div className="flex items-center">
          <Video className="h-4 w-4 mr-2 text-gray-400" />
          Telehealth Available
        </div>
      </div>

      <div className="flex space-x-3">
        <button className="flex-1 bg-indigo-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center">
          <Calendar className="h-4 w-4 mr-2" />
          Book Appointment
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
          <Phone className="h-4 w-4" />
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200">
          <Video className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Mental Health Providers</h1>
        <p className="text-gray-600">Connect with qualified professionals in your area</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, specialty, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>

            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {languages.map(language => (
                <option key={language} value={language}>{language}</option>
              ))}
            </select>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showOnlyAvailable}
                onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Available only</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showInsuranceOnly}
                onChange={(e) => setShowInsuranceOnly(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Accepts insurance</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Found <span className="font-semibold">{filteredProviders.length}</span> providers
        </p>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Filter className="h-4 w-4" />
          <span>Sort by: Availability</span>
        </div>
      </div>

      {/* Provider Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredProviders.map(provider => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </div>

      {/* Emergency Notice */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="bg-red-100 rounded-full p-2">
            <Phone className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-red-800 mb-1">Crisis Support</h3>
            <p className="text-red-700 text-sm mb-3">
              If you're experiencing a mental health emergency, please contact crisis support immediately.
            </p>
            <div className="flex space-x-4">
              <button className="bg-red-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200">
                Crisis Hotline: 988
              </button>
              <button className="border border-red-300 text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors duration-200">
                Emergency: 911
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}