import { createClient } from '@supabase/supabase-js';

const qp = new URLSearchParams(location.search);
const url = qp.get('supabaseUrl') || import.meta.env.VITE_SUPABASE_URL || '';
const key = qp.get('supabaseKey') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const isReal = !!url && !!key && !url.startsWith('__');
const sb = isReal ? createClient(url, key) : null;

async function submit(row){
  if (!sb) return { ok:false, local:true };
  try{
    const { error } = await sb.from('scores').insert(row);
    return { ok: !error, error };
  } catch(e){ return { ok:false, error:e }; }
}

async function top(limit=30){
  if (!sb) return null;
  try{
    const { data, error } = await sb.from('scores')
      .select('user_id,user_name,score,stage,created_at')
      .order('score',{ascending:false}).limit(limit);
    return error ? null : data;
  } catch(e){ return null; }
}

export const Board = { sb, enabled: !!sb, submit, top };
