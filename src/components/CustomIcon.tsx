import React from 'react';
import { FaRobot } from 'react-icons/fa';


const CustomIcon = () => {
  return (
    <div className="p-4 bg-gray-900 text-white rounded-xl shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <FaRobot className="text-cyan-400 text-2xl" />
        <h2 className="text-xl font-semibold">Bizactly.AI Assistant</h2>
      </div>
      <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
        {assistantIntro}
      </pre>
    </div>
  );
};

export default CustomIcon;
