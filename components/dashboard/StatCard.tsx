
import React from 'react';
import Icon from '../ui/Icon';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentProps<typeof Icon>['name'];
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
      <div className="bg-fgbmfi-blue/10 text-fgbmfi-blue rounded-full p-3">
        <Icon name={icon} className="h-7 w-7" />
      </div>
    </div>
  );
};

export default StatCard;
