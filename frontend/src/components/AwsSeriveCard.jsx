const AwsServiceCard = ({ title, icon, description, children }) => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="p-6">
          <div className="flex items-center mb-4">
            {icon}
            <h2 className="ml-3 text-xl font-semibold text-gray-800">{title}</h2>
          </div>
          <p className="text-gray-600 mb-6">{description}</p>
          {children}
        </div>
      </div>
    );
  };
  
  export default AwsServiceCard;