'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Tv, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Smartphone,
  Server,
  User,
  Lock
} from 'lucide-react';

type Step = 'code' | 'credentials' | 'success';

interface FormData {
  code: string;
  serverCode: string;
  username: string;
  password: string;
}

export default function TVAuthPage() {
  const [currentStep, setCurrentStep] = useState<Step>('code');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    code: '',
    serverCode: '',
    username: '',
    password: '',
  });

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Verificar se o código existe e está pendente
      const response = await fetch(`/api/device-code/status?code=${formData.code.toUpperCase()}`);
      
      if (response.status === 404) {
        setError('Código não encontrado. Verifique se digitou corretamente.');
        return;
      }
      
      if (response.status === 410) {
        setError('Código expirado. Gere um novo código na sua TV.');
        return;
      }

      if (!response.ok) {
        setError('Erro ao verificar código. Tente novamente.');
        return;
      }

      const data = await response.json();
      
      if (data.status === 'pending') {
        setCurrentStep('credentials');
      } else if (data.status === 'authenticated') {
        setError('Este código já foi autenticado.');
      } else if (data.status === 'expired') {
        setError('Código expirado. Gere um novo código na sua TV.');
      } else {
        setError('Código inválido ou já utilizado.');
      }
    } catch (err) {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.serverCode || !formData.username || !formData.password) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/device-code/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          serverCode: formData.serverCode,
          username: formData.username,
          password: formData.password,
        }),
      });

      if (response.status === 401) {
        setError('Credenciais inválidas. Verifique servidor, usuário e senha.');
        return;
      }

      if (response.status === 404) {
        setError('Servidor não encontrado ou inativo.');
        return;
      }

      if (response.status === 410) {
        setError('Código expirado. Gere um novo código na sua TV.');
        setCurrentStep('code');
        return;
      }

      if (response.status === 409) {
        setError('Este código já foi utilizado ou autenticado.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Erro ao autenticar. Tente novamente.');
        return;
      }

      setCurrentStep('success');
    } catch (err) {
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const formatCode = (code: string) => {
    const cleaned = code.replace(/[^A-Z0-9]/g, '').toUpperCase();
    if (cleaned.length <= 4) return cleaned;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
  };

  const resetForm = () => {
    setCurrentStep('code');
    setFormData({ code: '', serverCode: '', username: '', password: '' });
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Tv className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Conectar SmartTV
          </h1>
          <p className="text-gray-600">
            Autentique sua TV usando o código exibido na tela
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div 
          className="flex items-center justify-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === 'code' ? 'bg-blue-600 text-white' : 
              currentStep === 'credentials' || currentStep === 'success' ? 'bg-green-600 text-white' : 
              'bg-gray-300 text-gray-600'
            }`}>
              {currentStep === 'credentials' || currentStep === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Smartphone className="h-4 w-4" />
              )}
            </div>
            <div className={`w-12 h-1 rounded ${
              currentStep === 'credentials' || currentStep === 'success' ? 'bg-green-600' : 'bg-gray-300'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep === 'credentials' ? 'bg-blue-600 text-white' : 
              currentStep === 'success' ? 'bg-green-600 text-white' : 
              'bg-gray-300 text-gray-600'
            }`}>
              {currentStep === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
              {/* Step 1: Code Input */}
              {currentStep === 'code' && (
                <>
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Passo 1: Digite o Código
                    </CardTitle>
                    <CardDescription>
                      Insira o código de 8 caracteres exibido na sua TV
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCodeSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="code" className="text-sm font-semibold">
                          Código da TV
                        </Label>
                        <Input
                          id="code"
                          type="text"
                          placeholder="ABCD-1234"
                          value={formatCode(formData.code)}
                          onChange={(e) => handleInputChange('code', e.target.value.replace(/[^A-Z0-9]/g, ''))}
                          maxLength={9}
                          className="text-center text-lg font-mono tracking-wider h-12 border-2 focus:border-blue-500"
                          autoComplete="off"
                        />
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        disabled={loading || formData.code.length < 8}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          <>
                            Continuar
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </>
              )}

              {/* Step 2: Credentials */}
              {currentStep === 'credentials' && (
                <>
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Passo 2: Faça Login
                    </CardTitle>
                    <CardDescription>
                      Insira suas credenciais do servidor IPTV
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="serverCode" className="text-sm font-semibold flex items-center">
                          <Server className="h-4 w-4 mr-1" />
                          Código do Servidor
                        </Label>
                        <Input
                          id="serverCode"
                          type="text"
                          placeholder="123"
                          value={formData.serverCode}
                          onChange={(e) => handleInputChange('serverCode', e.target.value)}
                          className="h-11 border-2 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-semibold flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          Usuário
                        </Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="seu_usuario"
                          value={formData.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          className="h-11 border-2 focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold flex items-center">
                          <Lock className="h-4 w-4 mr-1" />
                          Senha
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="sua_senha"
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          className="h-11 border-2 focus:border-blue-500"
                        />
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex space-x-3">
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep('code')}
                          className="flex-1 h-11"
                          disabled={loading}
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Voltar
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1 h-11 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                          disabled={loading || !formData.serverCode || !formData.username || !formData.password}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Autenticando...
                            </>
                          ) : (
                            <>
                              Autenticar
                              <CheckCircle className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </>
              )}

              {/* Step 3: Success */}
              {currentStep === 'success' && (
                <>
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-xl font-bold text-green-900">
                      Autenticação Realizada!
                    </CardTitle>
                    <CardDescription className="text-green-700">
                      Sua TV já está conectada e pronta para uso
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <p className="text-green-800 font-medium mb-2">
                        ✅ Conexão estabelecida com sucesso
                      </p>
                      <p className="text-green-700 text-sm">
                        Você pode fechar esta página. Sua TV já tem acesso ao conteúdo.
                      </p>
                    </div>

                    <Button 
                      onClick={resetForm}
                      variant="outline"
                      className="w-full h-11 border-green-300 text-green-700 hover:bg-green-50"
                    >
                      Conectar Outra TV
                    </Button>
                  </CardContent>
                </>
              )}
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <motion.div 
          className="text-center mt-8 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p>Problemas? Entre em contato com o suporte técnico</p>
        </motion.div>
      </div>
    </div>
  );
}