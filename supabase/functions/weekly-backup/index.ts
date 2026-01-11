import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WordBackup {
  word: string
  definition: string
  phonetic: string | null
  example: string | null
  notes: string | null
  difficulty: number | null
  priority: number | null
  is_known: boolean | null
  is_bookmarked: boolean | null
  topik_level: string | null
  tags: unknown
}

interface ChapterBackup {
  id: string
  title: string
  description: string | null
  words: WordBackup[]
}

interface BackupData {
  created_at: string
  chapters: ChapterBackup[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all chapters
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('*')
      .order('created_at', { ascending: true })

    if (chaptersError) throw chaptersError

    // Build backup data as JSON
    const backupData: BackupData = {
      created_at: new Date().toISOString(),
      chapters: []
    }

    let totalWords = 0

    for (const chapter of chapters || []) {
      const { data: words, error: wordsError } = await supabase
        .from('words')
        .select('*')
        .eq('chapter_id', chapter.id)
        .order('created_at', { ascending: true })

      if (wordsError) throw wordsError

      totalWords += words?.length || 0

      backupData.chapters.push({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        words: words?.map(word => ({
          word: word.word,
          definition: word.definition,
          phonetic: word.phonetic,
          example: word.example,
          notes: word.notes,
          difficulty: word.difficulty,
          priority: word.priority,
          is_known: word.is_known,
          is_bookmarked: word.is_bookmarked,
          topik_level: word.topik_level,
          tags: word.tags
        })) || []
      })
    }

    // Create filename with timestamp
    const now = new Date()
    const filename = `backups/vocabulary-backup-${now.toISOString().split('T')[0]}-${now.getTime()}.json`

    // Upload to storage as JSON
    const { error: uploadError } = await supabase.storage
      .from('certificates')
      .upload(filename, JSON.stringify(backupData, null, 2), {
        contentType: 'application/json',
        upsert: true
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('certificates')
      .getPublicUrl(filename)

    console.log(`Backup created successfully: ${filename}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Weekly backup completed',
        filename,
        url: urlData.publicUrl,
        chaptersCount: chapters?.length || 0,
        wordsCount: totalWords,
        timestamp: now.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Backup error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
