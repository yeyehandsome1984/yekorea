import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { word } = await req.json();
    
    if (!word) {
      return new Response(
        JSON.stringify({ error: "Word is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Provide information about the Korean word "${word}" in this exact format:

Word: ${word}

English Meaning: [Provide a concise English definition in 1-2 lines]

Korean Meaning: [Provide a Korean language definition/explanation in 1-2 lines]

Pronunciation: [Write the ACTUAL KOREAN PRONUNCIATION (실제 발음) with sound changes (음운 변화) applied, in brackets. Apply all Korean phonological rules including: 연음법칙 (liaison), 비음화 (nasalization), 경음화 (tensification), 격음화 (aspiration), 구개음화 (palatalization), etc. Examples: 폭력→[퐁녁], 국물→[궁물], 학교→[학꾜], 십리→[심니], 닫히다→[다치다]. Only Hangul in brackets, no romanization, no explanations.]

Hanja: [If corresponding Chinese characters (Hanja) exist, provide ONLY the characters (e.g., "暴力"). If no Hanja exists, write exactly "N/A". Do NOT add any notes, explanations, or parenthetical remarks.]

Example Korean: [Provide one example sentence in Korean using this word]

Example English: [Provide English translation of the example sentence]

IMPORTANT: Keep responses minimal. No extra notes, explanations, or commentary in any field.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch word meaning" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    // Parse the response text to extract the relevant parts
    const englishMeaningMatch = responseText.match(/English Meaning:\s*(.*?)(?=\n|$)/);
    const englishMeaning = englishMeaningMatch?.[1]?.trim() || 'No meaning found';
    
    const koreanMeaningMatch = responseText.match(/Korean Meaning:\s*(.*?)(?=\n|$)/);
    const koreanMeaning = koreanMeaningMatch?.[1]?.trim() || 'No Korean meaning found';
    
    const pronunciationMatch = responseText.match(/Pronunciation:\s*(.*?)(?=\n|$)/);
    const pronunciation = pronunciationMatch?.[1]?.trim() || '';
    
    const hanjaMatch = responseText.match(/Hanja:\s*(.*?)(?=\n|$)/);
    const hanja = hanjaMatch?.[1]?.trim() || '';
    
    const exampleKoreanMatch = responseText.match(/Example Korean:\s*(.*?)(?=\n|$)/);
    const exampleKorean = exampleKoreanMatch?.[1]?.trim() || '';
    
    const exampleEnglishMatch = responseText.match(/Example English:\s*(.*?)(?=\n|$)/);
    const exampleEnglish = exampleEnglishMatch?.[1]?.trim() || '';

    const result = {
      englishMeaning,
      koreanMeaning,
      pronunciation,
      hanja,
      exampleKorean,
      exampleEnglish
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in fetch-word-meaning:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
