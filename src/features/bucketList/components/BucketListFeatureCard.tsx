import React from 'react';
import { FeatureActivationCard } from '../../../components/shared/FeatureActivationCard';

interface BucketListFeatureCardProps {
  enabled: boolean;
  onToggle: () => void;
  onInfo?: () => void;
}

export const BucketListFeatureCard: React.FC<BucketListFeatureCardProps> = (props) => (
  <FeatureActivationCard
    icon={<span role="img" aria-label="bucket">🪣</span>}
    title="Bucketlist"
    description="Samla dina drömmar och mål på ett inspirerande sätt."
    accentColor="accent"
    {...props}
  />
); 