import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FREE_TIER_LIMIT = 5;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Verify User
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Check Freemium Limits
    const { data: profile } = await supabaseClient.from('profiles').select('is_premium').eq('id', user.id).single();
    const { data: usage } = await supabaseClient.from('ai_usage').select('queries_used').eq('user_id', user.id).single();

    const queriesUsed = usage?.queries_used || 0;
    const isPremium = profile?.is_premium === true;

    if (!isPremium && queriesUsed >= FREE_TIER_LIMIT) {
      return new Response(JSON.stringify({ 
        error: 'Free tier limit reached', 
        requiresUpgrade: true,
        message: 'You have reached your 5 free AI queries. Please upgrade to Pro to continue.' 
      }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Parse Request
    const { action, text, context, options } = await req.json();
    
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY is not set in Supabase Secrets');
    }

    const genAI = new GoogleGenerativeAI(geminiKey);

    let systemInstruction = "You are the Maxe AI Coach, a helpful academic tutor for college students.";
    let prompt = text;
    let isJson = false;

    if (action === 'chat') {
      systemInstruction += `\nStudent Context: ${JSON.stringify(context || {})}. Do not give exact exam questions, label them as practice priorities. Be concise.`;
    } else if (action === 'process_notes') {
      const mode = options?.mode || 'summary';
      if (mode === 'flashcards') {
        systemInstruction = "You are an AI that extracts study flashcards from text. Return ONLY a JSON array of objects with 'front' and 'back' properties.";
        prompt = `Generate flashcards from this text. Make it concise.\n\nText:\n${text}`;
        isJson = true;
      } else if (mode === 'quiz') {
        systemInstruction = "You are an AI that generates multiple-choice quizzes. Return ONLY a JSON array of objects with 'question', 'options' (array of 4 strings), and 'answer' (exact string from options).";
        prompt = `Generate a quiz from this text.\n\nText:\n${text}`;
        isJson = true;
      } else {
        systemInstruction = "You are an AI that generates highly structured revision notes. Format in Markdown.";
        const extraInstructions = [
          options?.shorter && "Make it very short and concise.",
          options?.simpleEnglish && "Use extremely simple English.",
          options?.examImportant && "Focus ONLY on exam-important points."
        ].filter(Boolean).join(' ');
        
        prompt = `Generate notes/summary. ${extraInstructions}\n\nText:\n${text}`;
      }
    }

    // Initialize the model
    const model = genAI.getModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction,
      generationConfig: isJson ? { responseMimeType: "application/json" } : undefined
    });

    // 4. Generate Content
    const result = await model.generateContent(prompt);
    const replyText = result.response.text();

    let parsedContent = replyText;
    if (isJson) {
      try {
         parsedContent = JSON.parse(replyText);
      } catch (e) {
         console.error("Failed to parse JSON from AI", replyText);
      }
    }

    // 5. Increment Usage
    if (!isPremium) {
      const { error: updateError } = await supabaseClient.from('ai_usage').update({ queries_used: queriesUsed + 1 }).eq('user_id', user.id);
      if (updateError && updateError.code === 'PGRST116') {
         // Insert if not exists
         await supabaseClient.from('ai_usage').insert({ user_id: user.id, queries_used: 1 });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      result: parsedContent,
      queriesLeft: isPremium ? 'Unlimited' : (FREE_TIER_LIMIT - (queriesUsed + 1))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
