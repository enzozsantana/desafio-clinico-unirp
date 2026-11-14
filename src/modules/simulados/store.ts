import { sb } from '../../lib/supabase';
import type { Simulado } from './types';

export async function listSimulados(): Promise<Simulado[]> {
  const { data, error } = await sb
    .from('simulados')
    .select('id,dados')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => ({ ...(r.dados as object), id: r.id }) as Simulado);
}

export async function saveSimulado(sim: Simulado, professorId: string): Promise<void> {
  const body = JSON.parse(JSON.stringify(sim)) as Simulado;
  const id = body.id;
  const dados = { ...body };
  delete (dados as { id?: string }).id;
  const { error } = await sb
    .from('simulados')
    .upsert({ id, professor_id: professorId, dados }, { onConflict: 'id' });
  if (error) throw error;
}

export async function removeSimulado(id: string): Promise<void> {
  const { error } = await sb.from('simulados').delete().eq('id', id);
  if (error) throw error;
}