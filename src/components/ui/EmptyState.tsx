// Empty state placeholder with an icon, title, optional subtitle, and CTA

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  // Tailwind color class for the icon container background.
  iconBg?: string;
  // Tailwind color class for the icon.
  iconColor?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  ctaLabel,
  ctaHref,
  onCtaClick,
  iconBg = 'bg-slate-200',
  iconColor = 'text-slate-400',
}: EmptyStateProps) {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className={`w-28 h-28 ${iconBg} rounded-full flex items-center justify-center mb-6`}>
        <Icon className={`w-14 h-14 ${iconColor}`} />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{title}</h2>
      {subtitle && <p className="text-slate-500 font-medium mb-6 max-w-sm">{subtitle}</p>}
      {ctaLabel && (ctaHref ? (
        <Link
          href={ctaHref}
          className="mt-2 px-8 py-3.5 bg-slate-900 text-white font-black rounded-xl hover:bg-cyan-600 transition-all shadow-md"
        >
          {ctaLabel}
        </Link>
      ) : (
        <button
          onClick={onCtaClick}
          className="mt-2 px-8 py-3.5 bg-slate-900 text-white font-black rounded-xl hover:bg-cyan-600 transition-all shadow-md"
        >
          {ctaLabel}
        </button>
      ))}
    </div>
  );
}
