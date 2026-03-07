import { useState, useRef, useEffect } from 'react';
import { Calendar, Search, ChevronDown } from 'lucide-react';

export function MonthPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate last 24 months
  const months = Array.from({ length: 24 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return {
      value: `${year}-${month}`,
      label: d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
    };
  });

  const filteredMonths = months.filter((m) =>
    m.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel =
    months.find((m) => m.value === value)?.label || 'All Months';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-40 pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-700"
      >
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          <div className="px-2 pb-2 pt-1 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-primary"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto pt-1">
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearch('');
              }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${
                value === ''
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700'
              }`}
            >
              All Months
            </button>
            {filteredMonths.map((m) => (
              <button
                key={m.value}
                onClick={() => {
                  onChange(m.value);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${
                  value === m.value
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700'
                }`}
              >
                {m.label}
              </button>
            ))}
            {filteredMonths.length === 0 && (
              <div className="px-3 py-2 text-xs text-gray-500 text-center">
                No months found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
