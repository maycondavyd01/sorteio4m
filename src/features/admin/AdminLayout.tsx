import { useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LogOut, LayoutDashboard, FileText, Shuffle } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

function AdminLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logging, setLogging] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogging(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    setLogging(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Carregando...</div>;

  if (!session) {
    return (
      <div className="min-h-screen bg-outer flex items-center justify-center">
        <div className="bg-background rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-extrabold text-xl">R</span>
          </div>
          <h2 className="text-center font-bold text-xl mb-6">Painel Admin</h2>
          <form onSubmit={login} className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={logging}>
              {logging ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-outer">
      <div className="bg-background border-b border-border">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">R</span>
            </div>
            <span className="font-bold">Admin</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
            <LogOut size={16} className="mr-1" /> Sair
          </Button>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-2">
        <nav className="flex gap-1 mb-4 overflow-x-auto">
          <Link to="/admin" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition">
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <Link to="/admin/pedidos" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition">
            <FileText size={16} /> Pedidos
          </Link>
          <Link to="/admin/sorteio" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition">
            <Shuffle size={16} /> Sorteio
          </Link>
        </nav>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminLayout;
