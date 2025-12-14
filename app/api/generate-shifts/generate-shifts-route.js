import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function GET(request) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    const daysToGenerate = 7;
    const shiftsToCreate = [];

    // Generate shifts for next 7 days
    for (let i = 0; i < daysToGenerate; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      
      // Check if shift already exists for this date
      const { data: existingShift } = await supabase
        .from('shifts')
        .select('id')
        .eq('date', dateStr)
        .single();
      
      // Only create if doesn't exist
      if (!existingShift) {
        shiftsToCreate.push({
          date: dateStr,
          day_of_week: dayOfWeek,
          start_time: dayOfWeek === 'Sunday' ? null : '04:00:00', // Sunday = OFF (null)
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    }

    // Insert new shifts
    if (shiftsToCreate.length > 0) {
      const { data, error } = await supabase
        .from('shifts')
        .insert(shiftsToCreate)
        .select();

      if (error) throw error;

      return Response.json({
        success: true,
        message: `Generated ${shiftsToCreate.length} new shifts`,
        shifts: data
      });
    }

    return Response.json({
      success: true,
      message: 'All shifts already exist for next 7 days'
    });

  } catch (error) {
    console.error('Error generating shifts:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}