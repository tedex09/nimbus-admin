'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tv, Server, Shield, Globe, ArrowRight, Check } from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-8">
              <Tv className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              IPTV <span className="text-blue-600">Manager</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Sistema completo B2B para gerenciamento de servidores IPTV. 
              Gerencie múltiplos servidores, monitore conexões e otimize performance.
            </p>
            <div className="space-x-4">
              <Button
                size="lg"
                onClick={() => router.push('/login')}
                className="text-lg px-8 py-3"
              >
                Acessar Sistema
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Recursos Principais
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Tudo que você precisa para gerenciar seus servidores IPTV de forma eficiente e profissional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Server className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Gerenciamento Multi-Servidor</CardTitle>
              <CardDescription>
                Gerencie múltiplos servidores IPTV a partir de um único painel central
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>API XtreamCodes</CardTitle>
              <CardDescription>
                Integração nativa com XtreamCodes para consulta de filmes, séries e canais
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Cache Inteligente</CardTitle>
              <CardDescription>
                Sistema de cache Redis otimizado para melhor performance e menor latência
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Technical Features */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Tecnologia Avançada
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Desenvolvido com as melhores tecnologias para garantir performance, 
                segurança e escalabilidade.
              </p>
              <div className="space-y-4">
                {[
                  'Next.js 13 com App Router e TypeScript',
                  'MongoDB com Mongoose para dados estruturados',
                  'Redis para cache de alta performance',
                  'Autenticação segura com NextAuth',
                  'Design responsivo mobile-first',
                  'Interface moderna com Tailwind CSS'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-12 lg:mt-0">
              <Card className="border-0 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Dashboard Administrativo
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Servidores Ativos</span>
                      <span className="font-semibold text-green-600">15/18</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Usuários Online</span>
                      <span className="font-semibold">1,247</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Cache Hit Rate</span>
                      <span className="font-semibold text-blue-600">94.2%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                      <div className="bg-blue-600 h-2 rounded-full w-3/4"></div>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Performance do sistema
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Tv className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">IPTV Manager</span>
            </div>
            <p className="text-gray-400 mb-8">
              Sistema B2B para gerenciamento profissional de servidores IPTV
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/login')}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Fazer Login
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}