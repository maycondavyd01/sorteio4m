import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório').max(100),
  whatsapp: z.string()
    .min(14, 'WhatsApp inválido')
    .max(15, 'WhatsApp inválido')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato: (11) 99999-9999'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha rápida (mín. 6 chars)'),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function CheckoutAuth({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register: regLogin, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const { register: regSignup, handleSubmit: handleSignupSubmit, setValue, formState: { errors: signupErrors } } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const onLogin = async (data: LoginData) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
             throw new Error('E-mail ou senha incorretos.');
        }
        throw error;
      }
      
      toast.success('Login realizado com sucesso!');
      onAuthSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (data: RegisterData) => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
          if (authError.message.includes('already registered')) {
              throw new Error('Este e-mail já está em uso.');
          }
          throw authError;
      }

      if (authData.user) {
        // 2. Set profile data manually since trigger might only create an empty profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: data.nome,
            phone: data.whatsapp,
          })
          .eq('id', authData.user.id);
        
        if (profileError && profileError.code !== 'PGRST116') {
             // If trigger didn't fire or it failed to update, let's at least log it.
             console.error('Failed to update profile:', profileError);
        } else if (profileError?.code === 'PGRST116') {
             // Row not found? Insert it then (if trigger missing).
             await supabase.from('profiles').insert({
                 id: authData.user.id,
                 full_name: data.nome,
                 phone: data.whatsapp
             });
        }
        
        toast.success('Conta criada com sucesso!');
        onAuthSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-secondary p-5 rounded-xl border border-border">
      <h3 className="font-bold text-center mb-4 text-lg">Identificação</h3>
      
      {errorMsg && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="login">Já tenho conta</TabsTrigger>
          <TabsTrigger value="cadastro">Quero me Cadastrar</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
            <div>
              <Label htmlFor="login-email">E-mail</Label>
              <Input id="login-email" type="email" placeholder="seu@email.com" {...regLogin('email')} />
              {loginErrors.email && <p className="text-xs text-destructive mt-1">{loginErrors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="login-password">Senha</Label>
              <Input id="login-password" type="password" placeholder="********" {...regLogin('password')} />
              {loginErrors.password && <p className="text-xs text-destructive mt-1">{loginErrors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Entrando...' : 'Fazer Login e Continuar'}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="cadastro">
          <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" placeholder="Seu nome" {...regSignup('nome')} />
              {signupErrors.nome && <p className="text-xs text-destructive mt-1">{signupErrors.nome.message}</p>}
            </div>
            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                placeholder="(11) 99999-9999"
                {...regSignup('whatsapp')}
                onChange={(e) => {
                  const masked = maskPhone(e.target.value);
                  setValue('whatsapp', masked, { shouldValidate: true });
                }}
              />
              {signupErrors.whatsapp && <p className="text-xs text-destructive mt-1">{signupErrors.whatsapp.message}</p>}
            </div>
            <div>
              <Label htmlFor="signup-email">E-mail</Label>
              <Input id="signup-email" type="email" placeholder="seu@email.com" {...regSignup('email')} />
              {signupErrors.email && <p className="text-xs text-destructive mt-1">{signupErrors.email.message}</p>}
            </div>
            <div>
              <Label htmlFor="signup-password">Criar Senha</Label>
              <Input id="signup-password" type="password" placeholder="********" {...regSignup('password')} />
              {signupErrors.password && <p className="text-xs text-destructive mt-1">{signupErrors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Conta e Continuar'}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
