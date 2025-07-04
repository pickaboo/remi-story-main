import React from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { View } from '../types'; // Assuming types might be used if developed further
// If you need to navigate from here, uncomment and use:
// import { useNavigate } from 'react-router-dom'; // or your navigation hook/method

interface HomePageProps {
  // Example prop, adjust as needed if this page becomes more complex
  // onNavigate?: (view: View, params?: any) => void;
}

const HomePage: React.FC<HomePageProps> = () => {
  // This page is currently superseded by FeedPage for the View.Home route in App.tsx.
  // If this HomePage.tsx were to be used directly for a route, its content would go here.
  return (
    <PageContainer title="Hem">
      <div>
        <h1 className="text-2xl font-bold mb-4">Välkommen till REMI Story</h1>
        <p className="text-muted-text">
          Detta är en platshållare för startsidan. För närvarande visas Inläggsflödet (FeedPage) för standardvägen ('/').
        </p>
        <p className="text-muted-text mt-2">
          Om du såg ett fel relaterat till en felaktig importväg som <code className="bg-slate-100 p-1 rounded text-sm">@/services/storageService</code>,
          och den här filen var källan, är den nu korrigerad. Om felet kvarstår, kontrollera andra filer för den felaktiga importvägen.
        </p>
      </div>
    </PageContainer>
  );
};

export default HomePage;
