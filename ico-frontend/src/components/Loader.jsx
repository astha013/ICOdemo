const Loader = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-dark-700 rounded-full"></div>
        <div className="absolute top-0 left-0 w-12 h-12 border-4 border-primary-500 rounded-full animate-spin border-t-transparent"></div>
      </div>
      <p className="text-dark-400 text-sm">{message}</p>
    </div>
  );
};

export default Loader;
