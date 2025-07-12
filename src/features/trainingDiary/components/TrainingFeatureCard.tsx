import React from 'react';
import { FeatureActivationCard } from '../../../components/shared/FeatureActivationCard';

interface TrainingFeatureCardProps {
  enabled: boolean;
  onToggle: () => void;
  onInfo?: () => void;
}

export const TrainingFeatureCard: React.FC<TrainingFeatureCardProps> = (props) => (
  <FeatureActivationCard
    icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-primary"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6m-6 0a2 2 0 01-2-2v-2a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2m-6 0v2a2 2 0 002 2h4a2 2 0 002-2v-2" /></svg>}
    title="Träningsdagbok"
    description="Logga träningspass och följ din utveckling i dagboken."
    accentColor="primary"
    {...props}
  />
); 