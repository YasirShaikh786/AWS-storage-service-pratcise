const LoadingSpinner = ({ className = '' }) => (
    <div
      className={`inline-block w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin ${className}`}
    />
  );
  
  export default LoadingSpinner;