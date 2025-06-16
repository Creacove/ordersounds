
import React, { ReactNode } from 'react';
import ConditionalSolanaProvider from './ConditionalSolanaProvider';

interface WalletDependentWrapperProps {
  children: ReactNode;
}

export const WalletDependentWrapper: React.FC<WalletDependentWrapperProps> = ({ children }) => {
  return (
    <ConditionalSolanaProvider>
      {children}
    </ConditionalSolanaProvider>
  );
};
