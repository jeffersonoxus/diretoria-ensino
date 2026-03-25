'use client'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

export default function DashboardPage() {
  const supabase = createClient()
  const [acoes, setAcoes] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('acoes').select('*').order('created_at', { ascending: false })
      setAcoes(data || [])
    }
    fetchData()
  }, [])

  // --- Lógica das Datas (Próximas 2 Semanas) ---
  const diasCalendario = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const data = new Date()
      data.setDate(data.getDate() + i)
      return data
    })
  }, [])

  const turnos = ['Manhã', 'Tarde', 'Noite']

  // --- Lógica para o Gráfico de Pizza ---
  const dadosStatus = [
    { name: 'Pendente', value: acoes.filter(a => a.status === 'pendente').length, color: '#facc15' },
    { name: 'Realizada', value: acoes.filter(a => a.status === 'realizada').length, color: '#22c55e' },
    { name: 'Parcial', value: acoes.filter(a => a.status === 'parcial').length, color: '#3b82f6' },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6 p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Planejamento Quinzenal</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO ÚNICO (Lado Esquerdo) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border h-[400px]">
          <h2 className="text-sm font-bold text-gray-500 uppercase mb-4">Status Geral</h2>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={dadosStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {dadosStatus.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* CALENDÁRIO (Lado Direito - Ocupa 2 colunas) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-700">Cronograma de Turnos (14 dias)</h2>
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]"> {/* Garante scroll horizontal em telas menores */}
              {/* Cabeçalho de Dias */}
              <div className="grid grid-cols-[100px_repeat(14,1fr)] bg-gray-100 border-b">
                <div className="p-3 font-bold text-xs text-gray-500">Turno</div>
                {diasCalendario.map((dia, idx) => (
                  <div key={idx} className="p-3 text-center border-l border-gray-200">
                    <p className="text-[10px] uppercase font-bold text-blue-600">
                      {dia.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </p>
                    <p className="text-sm font-bold">{dia.getDate()}/{dia.getMonth() + 1}</p>
                  </div>
                ))}
              </div>

              {/* Linhas de Turnos */}
              {turnos.map((turno) => (
                <div key={turno} className="grid grid-cols-[100px_repeat(14,1fr)] border-b last:border-0">
                  <div className="p-4 flex items-center font-medium text-sm text-gray-600 bg-gray-50">
                    {turno}
                  </div>
                  {diasCalendario.map((dia, idx) => {
                    // Aqui você filtraria as ações do Supabase para este dia e turno específico
                    const temAcao = acoes.some(a => 
                      new Date(a.data_inicio).toDateString() === dia.toDateString() &&
                      a.turno?.toLowerCase() === turno.toLowerCase()
                    )

                    return (
                      <div key={idx} className="p-2 border-l border-gray-100 min-h-[80px] hover:bg-blue-50/30 transition-colors">
                        {temAcao && (
                          <div className="bg-blue-100 text-blue-700 p-1 rounded text-[9px] font-bold leading-tight border border-blue-200">
                            VISITA TÉCNICA
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}