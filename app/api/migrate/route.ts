import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: NextRequest) {
  try {
    const { secret } = await req.json()

    const expectedSecret = process.env.MIGRATE_SECRET
    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json({ error: "Secret inválido" }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        error: "SUPABASE_SERVICE_ROLE_KEY não configurado no .env.local",
        instruction: "Adicione SUPABASE_SERVICE_ROLE_KEY=sua_chave ao .env.local. A chave está em: Supabase Dashboard → Project Settings → API → service_role key"
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const sql = `
      ALTER TABLE acoes ADD COLUMN IF NOT EXISTS cancelamento_motivo TEXT;
      NOTIFY pgrst, 'reload schema';
    `

    const { error } = await supabase.rpc('exec_sql', { query: sql })

    if (error) {
      if (error.message?.includes('function exec_sql') || error.message?.includes('does not exist')) {
        return NextResponse.json({
          error: "Função exec_sql não encontrada. Crie-a no SQL Editor do Supabase.",
          instruction: `Execute no SQL Editor do Supabase:\n\nCREATE OR REPLACE FUNCTION exec_sql(query text)\nRETURNS void\nLANGUAGE plpgsql\nSECURITY DEFINER\nAS $$\nBEGIN\n  EXECUTE query;\nEND;\n$$;`,
          sql: sql
        }, { status: 500 })
      }
      return NextResponse.json({ error: error.message, sql }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Coluna cancelamento_motivo adicionada com sucesso!" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}
