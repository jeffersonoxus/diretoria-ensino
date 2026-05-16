import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TAMANHO_LIMITE, gerarCodigoAcesso, validarMimeTypeComExtensao } from '@/lib/documentos'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ erro: 'Não autenticado' }, { status: 401 })
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

    const formData = await request.formData()
    const file = formData.get('arquivo') as File | null
    const ticketId = formData.get('ticket_id') as string | null
    const titulo = formData.get('titulo') as string | null
    const descricao = formData.get('descricao') as string | null
    const categoriaId = formData.get('categoria_id') as string | null
    const formatoId = formData.get('formato_id') as string | null
    const setorId = formData.get('setor_id') as string | null
    const tagsRaw = formData.get('tags') as string | null
    const motivo = formData.get('motivo_tamanho') as string | null

    if (!file || !ticketId || !titulo || !setorId) {
      return NextResponse.json({ erro: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const { data: ticket, error: ticketError } = await supabase
      .from('upload_tickets')
      .select('*')
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ erro: 'Ticket inválido' }, { status: 400 })
    }

    if (ticket.usado) {
      return NextResponse.json({ erro: 'Ticket já utilizado' }, { status: 400 })
    }

    if (new Date(ticket.expira_em) < new Date()) {
      return NextResponse.json({ erro: 'Ticket expirado' }, { status: 400 })
    }

    if (file.size > TAMANHO_LIMITE.MAXIMO) {
      return NextResponse.json({ erro: 'Arquivo muito grande' }, { status: 400 })
    }

    if (!validarMimeTypeComExtensao(file.name, file.type)) {
      return NextResponse.json({ 
        erro: 'Extensão e tipo MIME não correspondem. Possível tentativa de renomeação maliciosa.' 
      }, { status: 400 })
    }

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    const storagePath = `documentos/${setorId}/${crypto.randomUUID()}${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { data: storageData, error: storageError } = await supabase.storage
      .from('documentos')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (storageError || !storageData) {
      return NextResponse.json({ erro: 'Erro ao fazer upload: ' + (storageError?.message || 'desconhecido') }, { status: 500 })
    }

    const { data: signedUrlData } = await supabase.storage
      .from('documentos')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365)

    const arquivoUrl = signedUrlData?.signedUrl || storageData.path

    const exigeJustificativa = file.size > TAMANHO_LIMITE.LIVRE
    const status = exigeJustificativa ? 'pendente' : 'ativo'
    const codigoAcesso = gerarCodigoAcesso()

    const tags: string[] = tagsRaw
      ? tagsRaw.split(',').map((t: string) => t.trim()).filter(Boolean)
      : []

    const docPayload: Record<string, any> = {
      titulo,
      descricao: descricao || null,
      categoria_id: categoriaId || null,
      formato_id: formatoId || null,
      setor_id: setorId,
      arquivo_url: arquivoUrl,
      arquivo_nome: file.name,
      arquivo_tamanho: file.size,
      status,
      motivo_tamanho: motivo || null,
      tags,
      codigo_acesso: codigoAcesso,
      criado_por: perfil.id,
    }

    const { data: doc, error: docError } = await supabase
      .from('documentos')
      .insert(docPayload)
      .select()
      .single()

    if (docError) {
      await supabase.storage.from('documentos').remove([storagePath])
      return NextResponse.json({ erro: 'Erro ao salvar registro: ' + docError.message }, { status: 500 })
    }

    await supabase
      .from('upload_tickets')
      .update({ usado: true })
      .eq('id', ticketId)

    return NextResponse.json({ documento: doc })
  } catch (err) {
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 })
  }
}
