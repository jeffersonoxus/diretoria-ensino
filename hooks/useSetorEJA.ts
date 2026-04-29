// hooks/useSetorEJA.ts
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useSetorEJA() {
    const [isSetorEJA, setIsSetorEJA] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function verificarSetorEJA() {
            try {
                // 1. Pega o usuário autenticado
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setIsSetorEJA(false);
                    setLoading(false);
                    return;
                }

                // 2. Busca o perfil do usuário na tabela perfis
                const { data: perfil } = await supabase
                    .from('perfis')
                    .select('id')
                    .eq('email', user.email)
                    .single();

                if (!perfil) {
                    setIsSetorEJA(false);
                    setLoading(false);
                    return;
                }

                // 3. Verifica se o perfil está no setor EJA
                const { data: setores, error } = await supabase
                    .from('setores')
                    .select('id, nome')
                    .eq('nome', 'EJA')
                    .contains('pessoas', [perfil.id]);

                if (error) {
                    console.error('Erro ao verificar setor EJA:', error);
                    setIsSetorEJA(false);
                } else {
                    setIsSetorEJA(setores && setores.length > 0);
                }

            } catch (error) {
                console.error('Erro:', error);
                setIsSetorEJA(false);
            } finally {
                setLoading(false);
            }
        }

        verificarSetorEJA();
    }, []);

    return { isSetorEJA, loading };
}