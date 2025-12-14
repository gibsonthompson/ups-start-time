'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Calendar, Bell } from 'lucide-react';

export default function WorkerDashboard() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextShift, setNextShift] = useState(null);
  const [timeUntil, setTimeUntil] = useState('');

  // Fetch shifts
  useEffect(() => {
    fetchShifts();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('shifts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, () => {
        fetchShifts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchShifts = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(7);

    if (error) {
      console.error('Error fetching shifts:', error);
    } else {
      setShifts(data || []);
      // Find next shift with an actual time (not Sunday OFF)
      const upcoming = data?.find(shift => shift.start_time !== null);
      setNextShift(upcoming || data?.[0]);
    }
    setLoading(false);
  };

  // Update countdown timer
  useEffect(() => {
    if (!nextShift || !nextShift.start_time) return;

    const updateTimer = () => {
      const now = new Date();
      
      // Parse shift date and time in local timezone
      const [year, month, day] = nextShift.date.split('-').map(Number);
      const [hours, minutes] = nextShift.start_time.split(':').map(Number);
      
      // Create date object in local timezone
      const shiftDateTime = new Date(year, month - 1, day, hours, minutes, 0);
      const diff = shiftDateTime - now;

      if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntil(`Starts in ${hours}h ${minutes}m`);
      } else {
        setTimeUntil('Started');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [nextShift]);

  const formatTime = (timeString) => {
    if (!timeString) return 'OFF';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  };

  const getDayColor = (dayOfWeek) => {
    const colors = {
      Sunday: 'bg-purple-500',
      Monday: 'bg-blue-500',
      Tuesday: 'bg-red-500',
      Wednesday: 'bg-green-500',
      Thursday: 'bg-yellow-500',
      Friday: 'bg-orange-500',
      Saturday: 'bg-pink-500',
    };
    return colors[dayOfWeek] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading shifts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-8">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">UPS Start Times</h1>
              <p className="text-sm text-gray-600">Your upcoming shifts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Shift - Large Card */}
      {nextShift && (
        <div className="max-w-md mx-auto px-6 mt-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl shadow-xl p-8 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Next Shift</span>
            </div>
            
            <div className="mb-2">
              <div className="text-lg font-medium opacity-90">
                {nextShift.day_of_week} {formatDate(nextShift.date)}
              </div>
            </div>

            <div className="text-6xl font-bold mb-4">
              {formatTime(nextShift.start_time)}
            </div>

            {nextShift.start_time && (
              <div className="text-sm opacity-75">
                {timeUntil}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Shifts List */}
      <div className="max-w-md mx-auto px-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Week
        </h2>
        
        <div className="space-y-3">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 ${getDayColor(shift.day_of_week)} rounded-xl flex items-center justify-center text-white font-bold shadow-md`}>
                  {shift.day_of_week.substring(0, 3)}
                </div>
                <div>
                  <div className="text-sm text-gray-500">
                    {shift.day_of_week}
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(shift.date)}
                  </div>
                </div>
              </div>
              
              <div className={`text-2xl font-bold ${shift.start_time ? 'text-gray-900' : 'text-gray-400'}`}>
                {formatTime(shift.start_time)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}