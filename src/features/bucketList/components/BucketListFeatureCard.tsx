import React from 'react';
import { FeatureActivationCard } from '../../../components/shared/FeatureActivationCard';

interface BucketListFeatureCardProps {
  enabled: boolean;
  onToggle: () => void;
  onInfo?: () => void;
}

export const BucketListFeatureCard: React.FC<BucketListFeatureCardProps> = (props) => (
  <FeatureActivationCard
    icon={
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6" aria-label="bucket-list-target">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    }
    title="Bucketlist"
    description="Samla dina drömmar och mål på ett inspirerande sätt."
    accentColor="accent"
    {...props}
  />
); 