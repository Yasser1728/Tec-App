'use client';

import { useState, useCallback } from 'react';

export interface DiagnosticEvent {
  timestamp: string;
  type: 'sdk_init' | 'auth' | 'approval' | 'completion' | 'error' | 'cancel';
  message: string;
  data?: unknown;
}

export const useDiagnostics = () => {
  const [events, setEvents] = useState<DiagnosticEvent[]>([]);

  const addEvent = useCallback((
    type: DiagnosticEvent['type'],
    message: string,
    data?: unknown
  ) => {
    const event: DiagnosticEvent = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data,
    };

    setEvents(prev => [...prev, event]);
    
    // Also log to console for debugging
    const icon = type === 'error' ? '❌' : type === 'approval' ? '✅' : type === 'completion' ? '✨' : '📋';
    console.log(`[Diagnostics ${icon}] ${message}`, data || '');
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return { events, addEvent, clearEvents };
};
