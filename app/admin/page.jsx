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
      const formattedDate = new Date(shift.date + 'T00:00:00').toLocaleDateString('en-US', { 
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

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter admin password"
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-600">Manage shift times & notifications</p>
            </div>
          </div>
          
          <button
            onClick={() => setIsAuthenticated(false)}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Announcement Section */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Send Announcement</h2>
          
          <div className="flex gap-3">
            <input
              type="text"
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Type announcement message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <button
              onClick={handleSendAnnouncement}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <Send className="w-5 h-5" />
              Send
            </button>
          </div>
        </div>
      </div>

      {/* Shifts List */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Manage Shifts</h2>
          
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading shifts...</div>
          ) : (
            <div className="space-y-3">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">
                      {formatDate(shift.date)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {shift.day_of_week}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {shift.day_of_week === 'Sunday' ? (
                      <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-semibold">
                        OFF
                      </div>
                    ) : (
                      <>
                        <input
                          type="time"
                          value={shift.start_time || ''}
                          onChange={(e) => handleTimeChange(shift.id, e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        
                        <button
                          onClick={() => handleSaveShift(shift)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}