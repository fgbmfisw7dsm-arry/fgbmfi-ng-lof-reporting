import React from 'react';
import Icon from '../ui/Icon';

interface ChartProps {
  title: string;
  type: 'line' | 'bar' | 'pie';
  data: { name: string; [key: string]: any }[];
  dataKey: string;
  onSliceClick?: (slice: any) => void;
}

const SummaryChart: React.FC<ChartProps> = ({ title, type, data, dataKey, onSliceClick }) => {
  const renderChartContent = () => {
    switch(type) {
      case 'line':
      case 'bar':
        const maxValue = Math.max(...data.map(d => d[dataKey]), 1);
        return (
          <div className="p-4 bg-gray-50 rounded-md">
            <div className="flex items-end justify-around h-48 border-l border-b border-gray-300">
              {data.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                   <div 
                    className={`w-8 bg-fgbmfi-blue hover:bg-blue-700 transition-all`}
                    style={{ height: `${(item[dataKey] / maxValue) * 100}%` }}
                    title={`${item.name}: ${item[dataKey].toLocaleString()}`}
                   ></div>
                   <span className="text-xs mt-2">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'pie':
        const canClick = !!onSliceClick;
        return (
          <div className="p-4 flex flex-col sm:flex-row items-center justify-around">
            <div className="relative w-48 h-48 mb-4 sm:mb-0">
              <Icon name="chart-pie" className="w-full h-full text-fgbmfi-blue" />
            </div>
            <ul className="space-y-2">
              {data.map((item, index) => (
                <li key={index}>
                    <button 
                        onClick={() => canClick && onSliceClick(item)} 
                        className={`flex items-center text-sm w-full text-left p-1 rounded-md ${canClick ? 'hover:bg-gray-100' : 'cursor-default'}`}
                        disabled={!canClick}
                    >
                      <span className={`w-3 h-3 rounded-full mr-2 bg-blue-${300 + index * 100}`}></span>
                      {item.name}: {item[dataKey].toLocaleString()}
                    </button>
                </li>
              ))}
            </ul>
          </div>
        );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      {renderChartContent()}
    </div>
  );
};

export default SummaryChart;