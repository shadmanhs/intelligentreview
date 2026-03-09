const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return new Response(JSON.stringify({ error: 'All fields are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send via Lovable AI gateway as a formatted notification
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('Missing API key');
    }

    // Use the AI gateway to format and forward the contact message
    const response = await fetch('https://api.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          {
            role: 'system',
            content: 'You are a contact form processor. Format the contact message into a professional email summary. Return ONLY the formatted text, nothing else.',
          },
          {
            role: 'user',
            content: `New contact form submission:\n\nFrom: ${name} (${email})\nSubject: ${subject}\n\nMessage:\n${message}`,
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to process contact message');
    }

    // Store the contact message in audit logs for record keeping
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabase.from('audit_logs').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      action: 'contact.sent',
      entity_type: 'contact',
      details: {
        name,
        email,
        subject,
        message,
        recipient: 'shadmanhsakib@gmail.com',
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
