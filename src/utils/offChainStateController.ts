import { web3 } from '@project-serum/anchor'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function addForum(forumID: web3.PublicKey, forumName: string, image?: string) {
    let { data: forum, error } = await supabase
        .from('forums')
        .insert({forum_id: forumID, forum_name: forumName, forum_image_url: image})
        .single()
}

export async function fetchForums() {
    let { data: forums, error } = await supabase.from('forums').select('*');
    return forums;
}