'use client'

import { Search, Filter, X } from 'lucide-react'

interface FiltrosDocumentoProps {
  categorias: Array<{ id: string; nome: string }>
  formatos: Array<{ id: string; nome: string }>
  setores: Array<{ id: string; nome: string }>
  busca: string
  categoriaId: string
  formatoId: string
  setorId: string
  status: string
  onBuscaChange: (v: string) => void
  onCategoriaChange: (v: string) => void
  onFormatoChange: (v: string) => void
  onSetorChange: (v: string) => void
  onStatusChange: (v: string) => void
  onLimpar: () => void
  temFiltros: boolean
}

export default function FiltrosDocumento({
  categorias, formatos, setores,
  busca, categoriaId, formatoId, setorId, status,
  onBuscaChange, onCategoriaChange, onFormatoChange, onSetorChange, onStatusChange,
  onLimpar, temFiltros,
}: FiltrosDocumentoProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter size={16} /> Filtros
        </div>
        {temFiltros && (
          <button onClick={onLimpar} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
            <X size={12} /> Limpar
          </button>
        )}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por título ou tags..."
          value={busca}
          onChange={(e) => onBuscaChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select value={categoriaId} onChange={(e) => onCategoriaChange(e.target.value)} className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todas as categorias</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>

        <select value={formatoId} onChange={(e) => onFormatoChange(e.target.value)} className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os formatos</option>
          {formatos.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
        </select>

        <select value={setorId} onChange={(e) => onSetorChange(e.target.value)} className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os setores</option>
          {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>

        <select value={status} onChange={(e) => onStatusChange(e.target.value)} className="w-full p-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="pendente">Pendente</option>
          <option value="rejeitado">Rejeitado</option>
        </select>
      </div>
    </div>
  )
}
