import React from 'react';
import { useBackgroundVisibility } from './common/hooks/useBackgroundVisibility';
import { AppRouter } from './AppRouter';

const App: React.FC = () => {
  // Background visibility management
  useBackgroundVisibility();

  return (
    <div className="App">
      <AppRouter />
    </div>
  );
};

export default App;
