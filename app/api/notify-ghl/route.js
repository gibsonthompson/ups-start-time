import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { message } = await request.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const ghlApiKey = process.env.GHL_API_KEY;
    const ghlLocationId = process.env.GHL_LOCATION_ID;
    const ghlWebhookUrl = process.env.GHL_WORKFLOW_WEBHOOK_URL;

    if (!ghlApiKey || !ghlLocationId) {
      console.error('GHL credentials not configured');
      return NextResponse.json(
        { error: 'GHL not configured' },
        { status: 500 }
      );
    }

    console.log('Fetching contacts from GHL...');
    
    // Get all contacts (this works - we tested it!)
    const contactsResponse = await fetch(
      `https://rest.gohighlevel.com/v1/contacts/?locationId=${ghlLocationId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
        },
      }
    );

    if (!contactsResponse.ok) {
      const errorText = await contactsResponse.text();
      console.error('Failed to fetch contacts:', contactsResponse.status, errorText);
      throw new Error(`Failed to fetch contacts: ${contactsResponse.status}`);
    }

    const contactsData = await contactsResponse.json();
    console.log('Total contacts fetched:', contactsData.contacts?.length || 0);

    // Filter contacts with tag "ups-workers"
    const workerContacts = (contactsData.contacts || []).filter(contact => 
      contact.tags && contact.tags.includes('ups-workers')
    );

    console.log(`Found ${workerContacts.length} contacts with tag 'ups-workers'`);

    if (workerContacts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No contacts found with tag "ups-workers"',
        sent: 0,
      });
    }

    // If no webhook URL, we can't send
    if (!ghlWebhookUrl) {
      console.error('GHL_WORKFLOW_WEBHOOK_URL not configured');
      return NextResponse.json({
        success: false,
        message: 'Webhook not configured. Add GHL_WORKFLOW_WEBHOOK_URL to .env.local',
        sent: 0,
      }, { status: 500 });
    }

    // Trigger webhook for each contact
    let successCount = 0;
    let failCount = 0;

    for (const contact of workerContacts) {
      const phone = contact.phone || contact.contactNumber;
      
      if (!phone) {
        console.log(`Skipping ${contact.firstName} ${contact.lastName} - no phone`);
        failCount++;
        continue;
      }

      try {
        // Trigger GHL workflow with contact ID
        const webhookResponse = await fetch(ghlWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contactId: contact.id,
            message: message,
            phone: phone,
            firstName: contact.firstName,
            lastName: contact.lastName,
          }),
        });

        if (webhookResponse.ok) {
          console.log(`✓ Webhook triggered for ${phone}`);
          successCount++;
        } else {
          const errorText = await webhookResponse.text();
          console.error(`✗ Webhook failed for ${phone}:`, webhookResponse.status, errorText);
          failCount++;
        }
      } catch (error) {
        console.error(`✗ Error triggering webhook for ${phone}:`, error.message);
        failCount++;
      }

      // Small delay between calls
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\nFinal Results: ${successCount} sent, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Notifications sent to ${successCount} of ${workerContacts.length} workers`,
      total: workerContacts.length,
      successful: successCount,
      failed: failCount,
    });
  } catch (error) {
    console.error('Error in notify-ghl:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications', details: error.message },
      { status: 500 }
    );
  }
}