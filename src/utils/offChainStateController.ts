import { PublicKey } from "@solana/web3.js"
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_FORUM_TYPE } from './consts'


export async function addForum(forumID: PublicKey, forumName: string, image?: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    let { data: forum, error } = await supabase
        .from('forums')
        .insert({forum_id: forumID, forum_name: forumName, forum_image_url: image, forum_type: DEFAULT_FORUM_TYPE})
        .single()
  } catch (e) {
    console.error(e)
  }
}

