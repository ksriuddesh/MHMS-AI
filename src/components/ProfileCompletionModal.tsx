import { useNavigate } from 'react-router-dom';
import { AlertCircle, User, X } from 'lucide-react';

interface ProfileCompletionModalProps {
  onClose: () => void;
}

export default function ProfileCompletionModal({ onClose }: ProfileCompletionModalProps) {
  const navigate = useNavigate();

  const handleComplete = () => {
    onClose();
    navigate('/patient-profile');
  };

  const handleSkip = () => {
    // Store that user skipped for this session
    sessionStorage.setItem('profileSkipped', '1');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-500" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Complete Your Patient Profile
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            To get the most out of your mental health journey, please complete your patient profile. 
            This helps us provide personalized care and track your progress effectively.
          </p>
        </div>

        {/* Features list */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6 space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">
              Personalized mental health insights
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">
              Better provider matching
            </span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">
              Secure and private data storage
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleComplete}
            className="w-full px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-sm"
          >
            Complete Profile Now
          </button>
          <button
            onClick={handleSkip}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            I'll do this later
          </button>
        </div>

        {/* Note */}
        <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
          You can complete your profile anytime from the sidebar menu
        </p>
      </div>
    </div>
  );
}
