import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, X, Check } from 'lucide-react';

const stages = [
  { id: 'idea', label: 'Idea' },
  { id: 'discovery', label: 'Discovery' },
  { id: 'validation', label: 'Validation' },
  { id: 'efficiency', label: 'Efficiency' },
  { id: 'scaling', label: 'Scaling' },
];

const archetypes = [
  { id: 'visionary', label: 'Visionary' },
  { id: 'hacker', label: 'Hacker' },
  { id: 'hustler', label: 'Hustler' },
  { id: 'designer', label: 'Designer' },
];

const founderTags = [
  'Serial Entrepreneur', 'First-time Founder', 'Technical Background', 
  'Business Background', 'Industry Expert', 'Side Project', 'Full-time Committed'
];

const investmentStages = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth'];

const focusAreas = ['Tech', 'Healthcare', 'Fintech', 'CleanTech', 'Consumer', 'B2B SaaS', 'DeepTech', 'Social Impact'];

const serviceTypes = [
  'Legal', 'Accounting', 'Marketing', 'Design', 'Development', 
  'HR & Recruitment', 'PR & Communications', 'Strategy Consulting', 'Fundraising Advisory'
];

export default function DiscoverFilters({ filters, onFiltersChange, activeCount }) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleOpen = (isOpen) => {
    if (isOpen) {
      setLocalFilters(filters);
    }
    setOpen(isOpen);
  };

  const toggleArrayFilter = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: prev[key]?.includes(value)
        ? prev[key].filter(v => v !== value)
        : [...(prev[key] || []), value]
    }));
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const clearFilters = () => {
    const cleared = {
      stages: [],
      archetypes: [],
      tags: [],
      investmentStages: [],
      industries: [],
      serviceTypes: []
    };
    setLocalFilters(cleared);
    onFiltersChange(cleared);
    setOpen(false);
  };

  const FilterSection = ({ title, items, filterKey, color = 'blue' }) => (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-slate-700 mb-3">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {items.map(item => {
          const value = typeof item === 'string' ? item : item.id;
          const label = typeof item === 'string' ? item : item.label;
          const isSelected = localFilters[filterKey]?.includes(value);
          
          return (
            <button
              key={value}
              onClick={() => toggleArrayFilter(filterKey, value)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1.5 ${
                isSelected
                  ? `bg-${color}-100 text-${color}-700 border-2 border-${color}-300`
                  : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'
              }`}
            >
              {isSelected && <Check className="w-3 h-3" />}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filters
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="mb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Filter Profiles</SheetTitle>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
                Clear all
              </Button>
            )}
          </div>
        </SheetHeader>
        
        <div className="overflow-y-auto h-[calc(100%-120px)] pb-4">
          <FilterSection 
            title="Startup Stage" 
            items={stages} 
            filterKey="stages"
          />
          
          <FilterSection 
            title="Founder Archetype" 
            items={archetypes} 
            filterKey="archetypes"
          />
          
          <FilterSection 
            title="Founder Tags" 
            items={founderTags} 
            filterKey="tags"
          />
          
          <FilterSection 
            title="Investment Stage (Investors)" 
            items={investmentStages} 
            filterKey="investmentStages"
          />
          
          <FilterSection 
            title="Industry Focus" 
            items={focusAreas} 
            filterKey="industries"
          />
          
          <FilterSection 
            title="Service Types" 
            items={serviceTypes} 
            filterKey="serviceTypes"
          />
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200">
          <Button 
            onClick={applyFilters}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}