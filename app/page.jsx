'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Calendar } from 'lucide-react';

export default function WorkerDashboard() {
  const [shifts, setShifts] = useState([]);
  const [nextShift, setNextShift] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShifts();

    // Real-time subscription - auto-updates when admin changes time
    const channel = supabase
      .channel('shifts-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shifts' },
        (payload) => {
          console.log('Shift updated:', payload);
          loadShifts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadShifts() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(7);
      
      if (error) throw error;
      
      setShifts(data || []);
      if (data && data.length > 0) {
        setNextShift(data[0]);
      }
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setLoading(false);
    }
  }

  const getTimeUntilShift = () => {
    if (!nextShift) return null;
    const now = new Date();
    const shiftTime = new Date(`${nextShift.date}T${nextShift.start_time}`);
    const diff = shiftTime - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 0) return 'Started';
    if (hours < 24) return `Starts in ${hours} hours`;
    const days = Math.floor(hours / 24);
    return `Starts in ${days} day${days > 1 ? 's' : ''}`;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const dayColors = {
    'Sunday': 'bg-purple-500',
    'Monday': 'bg-blue-500',
    'Tuesday': 'bg-red-500',
    'Wednesday': 'bg-green-500',
    'Thursday': 'bg-yellow-500',
    'Friday': 'bg-orange-500',
    'Saturday': 'bg-pink-500',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-gray-600">Loading start times...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-white font-bold text-xl">
            📦
          </div>
          <div>
            <h1 className="text-lg font-bold">UPS PRE-LOAD</h1>
            <p className="text-sm text-gray-600">START TIME</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        {/* Next Shift Card */}
        {nextShift ? (
          <div className="bg-white rounded-3xl p-6 shadow-md mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-500 text-sm mb-2">
                  {nextShift.day_of_week}
                </p>
                <h2 className="text-5xl font-bold text-gray-900">
                  {formatTime(nextShift.start_time)}
                </h2>
              </div>
              <div className="text-4xl">📦</div>
            </div>
            <div className="bg-green-500 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm font-medium">
              <Clock size={16} />
              {getTimeUntilShift()}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 shadow-md mb-6 text-center">
            <p className="text-gray-500">No upcoming shifts scheduled</p>
          </div>
        )}

        {/* Upcoming Shifts */}
        {shifts.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="text-gray-600 flex items-center gap-1">
                <Calendar size={16} />
                Upcoming Shifts
              </span>
            </div>
            
            <div className="space-y-3">
              {shifts.map((shift) => (
                <div 
                  key={shift.id}
                  className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4"
                >
                  <div className={`w-14 h-14 ${dayColors[shift.day_of_week]} rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0`}>
                    {shift.day_of_week.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {shift.day_of_week} - {formatTime(shift.start_time)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(shift.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto flex justify-around py-3">
          <button className="flex flex-col items-center gap-1 text-gray-900">
            <Calendar size={24} />
            <span className="text-xs font-medium">Schedule</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <Clock size={24} />
            <span className="text-xs">History</span>
          </button>
        </div>
      </div>
    </div>
  );
}
