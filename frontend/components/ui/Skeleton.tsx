"use client";

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export function Skeleton({ className = "", variant = 'rect' }: SkeletonProps) {
  const baseClass = "animate-pulse bg-[#e9ebec]";
  
  const variantClasses = {
    rect: "rounded-lg",
    circle: "rounded-full",
    text: "rounded h-4 w-full"
  };

  return (
    <div 
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#e9ebec] p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circle" className="h-12 w-12" />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-1/3" />
          <Skeleton variant="text" className="w-1/4 h-3" />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-[#eff2f7]">
      <Skeleton variant="rect" className="h-8 w-8" />
      <Skeleton variant="text" className="flex-1" />
      <Skeleton variant="text" className="w-24" />
      <Skeleton variant="text" className="w-24" />
      <Skeleton variant="circle" className="h-8 w-8" />
    </div>
  );
}
