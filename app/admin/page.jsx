'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Edit2, Send, X, Check } from 'lucide-react';

export default function AdminPanel() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [shifts, setShifts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (authenticated) {
      loadShifts();
    }
  }, [authenticated]);

  async function loadShifts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) throw error;
      setShifts(data || []);
    } catch (error) {
      console.error('Error loading shifts:', error);
      alert('Error loading shifts');
    } finally {
      setLoading(false);
    }
  }

  async function updateShift(id, newTime) {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .update({ 
          start_time: newTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Format the time nicely
        const [hours, minutes] = newTime.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const formattedTime = `${displayHour}:${minutes} ${ampm}`;

        // Trigger GHL SMS notification with line breaks
        const message = `⏰ START TIME UPDATED:\n${data.day_of_week} ${new Date(data.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}\n${formattedTime}`;
        
        await fetch('/api/notify-ghl', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });

        loadShifts();
        setEditingId(null);
        alert('Shift updated and workers notified!');
      }
    } catch (error) {
      console.error('Error updating shift:', error);
      alert('Error updating shift');
    }
  }

  async function sendCustomMessage() {
    if (!customMessage.trim()) {
      alert('Please enter a message');
      return;
    }
    
    setSending(true);
    try {
      const response = await fetch('/api/notify-ghl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: customMessage })
      });

      if (response.ok) {
        setCustomMessage('');
        alert('Message sent to all workers!');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setSending(false);
    }
  }

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuthenticated(true);
    } else {
      alert('Wrong password');
      setPassword('');
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <p className="text-gray-600 text-sm mt-2">Enter password to manage start times</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gray-900 text-white rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-400 text-sm">Manage start times & send notifications</p>
            </div>
            <button
              onClick={() => setAuthenticated(false)}
              className="text-sm bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Shifts Management */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Upcoming Shifts</h2>
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading shifts...</div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No shifts scheduled</div>
          ) : (
            <div className="space-y-3">
              {shifts.map((shift) => (
                <div 
                  key={shift.id} 
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:border-blue-300 transition"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{shift.day_of_week}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(shift.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  
                  {editingId === shift.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        defaultValue={shift.start_time}
                        className="border border-gray-300 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        id={`time-${shift.id}`}
                      />
                      <button
                        onClick={() => {
                          const newTime = document.getElementById(`time-${shift.id}`).value;
                          if (newTime) {
                            updateShift(shift.id, newTime);
                          }
                        }}
                        className="bg-green-600 text-white p-2 rounded hover:bg-green-700 transition"
                        title="Save"
                      >
                        <Check size={18} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-500 hover:text-gray-700 p-2"
                        title="Cancel"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatTime(shift.start_time)}
                      </span>
                      <button
                        onClick={() => setEditingId(shift.id)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded transition"
                        title="Edit time"
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Notification */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Send size={20} className="text-green-600" />
            Send Custom Notification
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Send a message to all workers (closures, delays, announcements, etc.)
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendCustomMessage()}
              placeholder="e.g., Warehouse closed due to weather..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={sendCustomMessage}
              disabled={sending || !customMessage.trim()}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}