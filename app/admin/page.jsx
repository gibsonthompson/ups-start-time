'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, Save, LogOut, Send } from 'lucide-react';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchShifts();
    }
  }, [isAuthenticated]);

  const fetchShifts = async () => {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching shifts:', error);
    } else {
      setShifts(data || []);
    }
    setLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect password');
    }
  };

  const handleTimeChange = (id, newTime) => {
    setShifts(shifts.map(shift => 
      shift.id === id ? { ...shift, start_time: newTime } : shift
    ));
  };

  const handleSaveShift = async (shift) => {
    // Don't allow editing Sunday to have a time
    if (shift.day_of_week === 'Sunday' && shift.start_time) {
      alert('Sunday shifts must remain OFF');
      fetchShifts(); // Reset to original
      return;
    }

    const { error } = await supabase
      .from('shifts')
      .update({ 
        start_time: shift.start_time,
        updated_at: new Date().toISOString()
      })
      .eq('id', shift.id);

    if (error) {
      console.error('Error updating shift:', error);
      alert('Error saving shift');
    } else {
      // Send SMS notification
      const shiftDate = new Date(shift.date + 'T00:00:00');
      const formattedDate = shiftDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'numeric',
        day: 'numeric'
      });
      
      const formattedTime = shift.start_time 
        ? formatTime(shift.start_time)
        : 'OFF';

      const message = `⏰ START TIME UPDATED:\n${formattedDate}\n${formattedTime}`;
      
      await fetch('/api/notify-ghl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      alert('Shift saved & SMS sent!');
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcement.trim()) {
      alert('Please enter a message');
      return;
    }

    const message = `📢 ANNOUNCEMENT:\n${announcement}`;
    
    const response = await fetch('/api/notify-ghl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (response.ok) {
      alert('Announcement sent to all workers!');
      setAnnouncement('');
    } else {
      alert('Error sending announcement');
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'OFF';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="Enter admin password"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-base"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-4 sm:mb-6">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Clock className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Admin Panel</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Manage shift times & notifications</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsAuthenticated(false)}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Announcement Section */}
      <div className="max-w-4xl mx-auto mb-4 sm:mb-6">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Send Announcement</h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Type announcement message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
            />
            
            <button
              onClick={handleSendAnnouncement}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-base"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Shifts List */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Manage Shifts</h2>
          
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading shifts...</div>
          ) : (
            <div className="space-y-3">
              {shifts.map((shift) => {
                // Parse date correctly to avoid timezone issues
                const shiftDate = new Date(shift.date + 'T00:00:00');
                const dateDisplay = shiftDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'numeric',
                  day: 'numeric',
                  year: 'numeric'
                });
                
                return (
                  <div
                    key={shift.id}
                    className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    {/* Date - Always full width */}
                    <div className="mb-3">
                      <div className="font-semibold text-gray-900 text-base sm:text-lg">
                        {dateDisplay}
                      </div>
                    </div>

                    {/* Time input and Save button */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      {shift.day_of_week === 'Sunday' ? (
                        <div className="w-full px-4 py-3 bg-gray-100 text-gray-600 rounded-lg font-semibold text-center text-base">
                          OFF
                        </div>
                      ) : (
                        <>
                          <input
                            type="time"
                            value={shift.start_time || ''}
                            onChange={(e) => handleTimeChange(shift.id, e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                          />
                          
                          <button
                            onClick={() => handleSaveShift(shift)}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-base sm:flex-shrink-0"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}