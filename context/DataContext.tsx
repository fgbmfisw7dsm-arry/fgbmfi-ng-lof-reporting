import React, { createContext, useState, useMemo } from 'react';

interface DataContextType {
  dataVersion: number;
  refreshData: () => void;
}

export const DataContext = createContext<DataContextType>({
  dataVersion: 0,
  refreshData: () => {},
});

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataVersion, setDataVersion] = useState(0);

  const refreshData = () => {
    setDataVersion(v => v + 1);
  };

  const contextValue = useMemo(() => ({
    dataVersion,
    refreshData
  }), [dataVersion]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};
