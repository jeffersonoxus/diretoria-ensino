// app/(auth)/login/page.tsx
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { Sparkles } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const confirmed = searchParams.get('confirmed');
    const errorParam = searchParams.get('error');
    const msg = searchParams.get('message');
    
    if (confirmed === 'true') {
      setMessage('✅ Email confirmado com sucesso! Agora você pode fazer login.');
    } else if (errorParam) {
      setError(errorParam);
    } else if (msg) {
      setMessage(decodeURIComponent(msg));
    }
    
    // Limpar os parâmetros da URL sem recarregar a página
    const url = new URL(window.location.href);
    url.searchParams.delete('confirmed');
    url.searchParams.delete('error');
    url.searchParams.delete('message');
    window.history.replaceState({}, '', url.toString());
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/dien');
      router.refresh();
    } catch (error: any) {
      if (error.message.includes('Email not confirmed')) {
        setError('Email não confirmado. Verifique sua caixa de entrada e confirme seu email antes de fazer login.');
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-purple-100 p-3 rounded-full">
            <Sparkles className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-gray-800">
          Entrar no DIEN
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Ou{' '}
          <Link href="/cadastro" className="font-medium text-purple-600 hover:text-purple-500 transition-colors">
            criar uma nova conta
          </Link>
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10 border border-purple-100">
          {message && (
            <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
              <p className="text-sm text-green-700">{message}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
            />

            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <Button 
              type="submit" 
              fullWidth 
              loading={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Entrar
            </Button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-purple-100 py-4">
        <div className="text-center">
          <p className="text-gray-500 text-xs sm:text-sm">
            Desenvolvido por Jefferson
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}