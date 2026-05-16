import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TAMANHO_LIMITE } from '@/lib/documentos'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
    }

    const { arquivo_nome, arquivo_tamanho, setor_id } = await request.json()

    if (!arquivo_nome || !arquivo_tamanho || !setor_id) {
      return NextResponse.json({ erro: 'Campos obrigatórios: arquivo_nome, arquivo_tamanho, setor_id' }, { status: 400 })
    }

    if (arquivo_tamanho > TAMANHO_LIMITE.MAXIMO) {
      return NextResponse.json({ erro: 'Arquivo muito grande. Máximo 10 MB.' }, { status: 400 })
    }

    const { data: perfil } = await supabase
      .from('perfis')
      .select('id')
      .eq('email', user.email)
      .single()

    if (!perfil) {
      return NextResponse.json({ erro: 'Perfil não encontrado' }, { status: 404 })
    }

    const isAdmin = user.email === 'admin@exemplo.com' || user.email === 'jeffersonoxus@gmail.com'

    if (!isAdmin) {
      const { data: setores } = await supabase
        .from('setores')
        .select('id')
        .contains('pessoas', [perfil.id])
        .eq('id', setor_id)

      if (!setores || setores.length === 0) {
        return NextResponse.json({ erro: 'Você não pertence a este setor' }, { status: 403 })
      }
    }

    const { data: quota } = await supabase
      .from('limites_setor')
      .select('storage_limit_bytes')
      .eq('setor_id', setor_id)
      .single()

    if (quota) {
      const { data: totalUsado } = await supabase
        .from('documentos')
        .select('arquivo_tamanho')
        .eq('setor_id', setor_id)
        .neq('status', 'rejeitado')

      const usadoBytes = (totalUsado || []).reduce((acc, d) => acc + Number(d.arquivo_tamanho), 0)
      if (usadoBytes + arquivo_tamanho > quota.storage_limit_bytes) {
        return NextResponse.json({ erro: 'Limite de armazenamento do setor excedido.' }, { status: 413 })
      }
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('upload_tickets')
      .insert({
        setor_id,
        criado_por: perfil.id,
        arquivo_nome,
        arquivo_tamanho,
      })
      .select()
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ erro: 'Erro ao criar ticket de upload' }, { status: 500 })
    }

    return NextResponse.json({ ticket_id: ticket.id, expira_em: ticket.expira_em })
  } catch (err) {
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 })
  }
}
