import { Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface PerformanceRatingProps {
  vendorId: string;
  vendorName: string;
  rating?: number; // 0-5, undefined for new vendors
  status: 'Rated' | 'NotRated' | 'NewVendor';
  showProfileLink?: boolean;
}

export function PerformanceRating({
  vendorId,
  vendorName,
  rating,
  status,
  showProfileLink = true,
}: PerformanceRatingProps) {
  // Render stars
  const renderStars = (score: number) => {
    const fullStars = Math.floor(score);
    const hasHalfStar = score % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-0.5">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-amber-500 text-amber-500" />
        ))}
        {/* Half star (for future use) */}
        {hasHalfStar && (
          <Star key="half" className="w-4 h-4 fill-amber-500 text-amber-500" />
        )}
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 fill-none text-gray-300" />
        ))}
      </div>
    );
  };

  // New Vendor - No rating yet
  if (status === 'NewVendor') {
    return (
      <div className="flex items-center">
        <span className="text-sm text-gray-400 italic">—</span>
      </div>
    );
  }

  // Not Rated - Vendor exists but no rating
  if (status === 'NotRated' || !rating) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-sm text-gray-400 italic">Not yet rated</span>
        {showProfileLink && (
          <Link
            href={`/vendors/${vendorId}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
          >
            View Profile
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
    );
  }

  // Rated - Show stars and score
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {renderStars(rating)}
        <span className="text-sm font-medium text-gray-900">{rating.toFixed(1)}</span>
      </div>
      {showProfileLink && (
        <Link
          href={`/vendors/${vendorId}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          View Profile
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
