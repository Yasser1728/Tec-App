'use client';

import { useContext } from 'react';
import { TecAuthContext } from './provider';

export const useTecAuth = () => {
  const context = useContext(TecAuthContext);
  if (!context) {
    throw new Error('useTecAuth must be used within <TecAuthProvider>');
  }
  return context;
};
