import React from 'react';
import { useMarketStore } from '@/store/marketStore';
import { Building2, Globe, Users, MapPin, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileTabProps {
  activeSymbol: string;
}

export function ProfileTab({ activeSymbol }: ProfileTabProps) {
  const stockProfile = useMarketStore(state => state.stockProfile);

  if (!stockProfile) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const {
    longBusinessSummary,
    industry,
    sector,
    website,
    country,
    city,
    fullTimeEmployees
  } = stockProfile;

  // Render a clean fallback if there is no description
  const description = longBusinessSummary || "Company description is not available.";
  const location = [city, country].filter(x => x && x !== "N/A").join(", ") || "N/A";

  return (
    <div className="flex flex-col space-y-6 w-full pb-20">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-emerald-400" /> Company Profile
        </h2>
        <p className="text-gray-400 text-sm">Learn more about the company's history, operations, and business areas.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Column: Description */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <h3 className="text-lg font-bold text-white mb-4">About Company</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
              {description}
            </p>
          </div>
        </div>

        {/* Right Column: Quick Stats & Links */}
        <div className="space-y-6">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <h3 className="text-lg font-bold text-white mb-6">Detailed Information</h3>
            
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 mt-0.5">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Sector / Industry</p>
                  <p className="text-sm text-gray-200 font-medium">{sector}</p>
                  <p className="text-xs text-gray-400">{industry}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Headquarters</p>
                  <p className="text-sm text-gray-200 font-medium">{location}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 mt-0.5">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Employees</p>
                  <p className="text-sm text-gray-200 font-medium">
                    {fullTimeEmployees !== "N/A" && fullTimeEmployees 
                      ? new Intl.NumberFormat('id-ID').format(fullTimeEmployees) 
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {website && website !== "" && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <a 
                  href={website.startsWith('http') ? website : `https://${website}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-colors"
                >
                  <Globe className="w-4 h-4" /> Visit Website
                </a>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
