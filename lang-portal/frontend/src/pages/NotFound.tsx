import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
      <div className="text-primary-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
      >
        Go to Dashboard
      </button>
    </div>
  );
} 