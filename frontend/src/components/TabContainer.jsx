import { useState } from 'react';

const TabContainer = ({ tabs, children }) => {
  const [activeTab, setActiveTab] = useState(tabs[0].id);

  return (
    <div className="mt-4">
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === tab.id
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-4">
        {children.find((child) => child.props.id === activeTab)}
      </div>
    </div>
  );
};

export default TabContainer;