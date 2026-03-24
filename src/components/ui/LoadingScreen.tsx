// ===== src/components/ui/LoadingScreen.tsx =====
// Full-page loading spinner shown while data is being fetched

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  /** Tailwind color class for the spinner, default "text-cyan-600" */
  color?: string;
}

export default function LoadingScreen({ color = 'text-cyan-600' }: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Loader2 className={`w-12 h-12 animate-spin ${color}`} />
    </div>
  );
}
