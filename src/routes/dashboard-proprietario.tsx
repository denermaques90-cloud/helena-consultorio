import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  LayoutDashboard, Users, Calendar, DollarSign, Briefcase, Settings, LogOut, 
  ChevronDown, Search, Menu, X, ArrowUpRight, ArrowDownRight, User, TrendingUp,
  Trash2, Power, AlertCircle
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/dashboard-proprietario")({
  head: () => ({ meta: [{ title: "Dashboard Proprietário - Dra. Helena Martins" }] }),
  component: DashboardProprietario,
});

type Agendamento = { id: string; cliente_nome: string; cliente_whatsapp: string; data: string; hora: string; servico_ids: string[]; status: string; profissional_id: string | null; profissional_nome: string | null; valor_total: number | null };
type Profissional = { id: string; nome: string; especialidade: string | null; whatsapp: string | null; senha: string; ativo: boolean; role: string | null; deleted_at: string | null };

function DashboardProprietario() {
  const [logged, setLogged] = useState(false);
  const [pass, setPass] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("master_auth") === "true") setLogged(true);
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pass === "090223") {
      sessionStorage.setItem("master_auth", "true");
      setLogged(true);
    } else toast.error("Senha incorreta");
  }

  if (!logged) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-5">
        <form onSubmit={handleLogin} className="premium-card p-10 w-full max-w-sm text-center bg-white shadow-xl">
          <h1 className="font-serif text-2xl text-primary mb-6">Acesso Proprietário</h1>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Senha Master" className="w-full bg-secondary border border-border rounded p-3 text-center outline-none focus:border-primary" />
          <button className="mt-4 w-full bg-primary text-white py-3 rounded font-bold hover:bg-primary/90 transition-colors">Acessar</button>
        </form>
      </div>
    );
  }

  return <DashboardLayout />;
}

function DashboardLayout() {
  const [tab, setTab] = useState("dashboard");
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [professionalToDelete, setProfessionalToDelete] = useState<Profissional | null>(null);
  
  const fetchInitialData = async () => {
    const [{ data: ags }, { data: prfs }] = await Promise.all([
      supabase.from("agendamentos").select("*").in("status", ["confirmado", "concluido"]),
      supabase.from("profissionais").select("*").is("deleted_at", null)
    ]);
    if (ags) setAgendamentos(ags as Agendamento[]);
    if (prfs) setProfissionais(prfs as Profissional[]);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const totalRevenue = useMemo(() => agendamentos.reduce((acc, a) => acc + (a.valor_total || 0), 0), [agendamentos]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from("profissionais").update({ ativo: !currentStatus }).eq("id", id);
    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success(currentStatus ? "Profissional desativado" : "Profissional ativado");
      setProfissionais(prev => prev.map(p => p.id === id ? { ...p, ativo: !currentStatus } : p));
    }
  };

  const handleDelete = async () => {
    if (!professionalToDelete) return;
    const { error } = await supabase.from("profissionais").update({ deleted_at: new Date().toISOString() }).eq("id", professionalToDelete.id);
    if (error) {
      toast.error("Erro ao excluir profissional");
    } else {
      toast.success("Profissional excluído com sucesso");
      setProfissionais(prev => prev.filter(p => p.id !== professionalToDelete.id));
    }
    setDeleteConfirmOpen(false);
    setProfessionalToDelete(null);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-border p-8 hidden lg:flex flex-col h-screen sticky top-0">
        <div className="mb-12">
          <h2 className="font-serif text-2xl text-primary leading-tight">Dra. Helena Martins</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mt-1">Gestão Clínica</p>
        </div>
        
        <nav className="space-y-2 flex-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "profissionais", label: "Profissionais", icon: Users },
            { id: "agendamentos", label: "Agendamentos", icon: Calendar },
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)} 
              className={`flex items-center gap-3 w-full p-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                tab === t.id 
                  ? "bg-primary/5 text-primary shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <t.icon size={18} className={tab === t.id ? "text-primary" : "text-muted-foreground"} /> 
              {t.label}
            </button>
          ))}
        </nav>
        
        <div className="pt-8 border-t border-border">
          <button 
            onClick={() => {sessionStorage.clear(); window.location.reload();}} 
            className="flex items-center gap-3 w-full p-4 text-sm font-semibold text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut size={18} /> Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-serif text-foreground">Painel de Controle</h1>
            <p className="text-sm text-muted-foreground mt-1">Bem-vinda de volta ao centro de operações da clínica.</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-border shadow-sm">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Acesso Proprietária</span>
          </div>
        </header>

        {tab === "dashboard" && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard label="Faturamento Total" value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} trend="+12.5%" />
              <MetricCard label="Total Agendamentos" value={agendamentos.length} icon={Calendar} trend="+4.2%" />
              <MetricCard label="Equipe Ativa" value={profissionais.filter(p => p.ativo).length} icon={Users} trend="Crescente" />
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="premium-card p-8 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-serif text-xl text-foreground">Desempenho Financeiro por Profissional</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <TrendingUp size={14} className="text-primary" />
                    Atualizado em tempo real
                  </div>
                </div>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profissionais.map(p => ({
                        nome: p.nome.split(" ")[0],
                        faturamento: agendamentos.filter(a => a.profissional_id === p.id).reduce((acc, a) => acc + (a.valor_total || 0), 0)
                    })).sort((a,b) => b.faturamento - a.faturamento)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                      <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B6B6B' }} />
                      <Tooltip 
                        cursor={{ fill: '#F7F5F0' }}
                        contentStyle={{ borderRadius: "12px", border: "1px solid #DCD9D3", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} 
                      />
                      <Bar dataKey="faturamento" fill="#2F8F6F" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "profissionais" && (
          <div className="premium-card bg-white shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-serif text-xl text-foreground">Gestão da Equipe</h3>
                <p className="text-sm text-muted-foreground mt-1">Gerencie profissionais e controle permissões de acesso.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-secondary/50 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  <tr>
                    <th className="px-8 py-5">Nome do Profissional</th>
                    <th className="px-8 py-5">Especialidade</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {profissionais.map(p => (
                    <tr key={p.id} className="group hover:bg-secondary/20 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                            {p.nome.slice(0, 2)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">{p.nome}</div>
                            <div className="text-xs text-muted-foreground">{p.whatsapp}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-sm font-medium text-muted-foreground">{p.especialidade}</td>
                      <td className="px-8 py-6 text-center">
                        <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-full ${p.ativo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {p.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {p.role !== 'owner' && (
                            <>
                              <button 
                                onClick={() => handleToggleActive(p.id, p.ativo)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all ${
                                  p.ativo 
                                    ? "bg-amber-50 text-amber-600 hover:bg-amber-100" 
                                    : "bg-primary/5 text-primary hover:bg-primary/10"
                                }`}
                              >
                                <Power size={12} />
                                {p.ativo ? "Desativar" : "Ativar"}
                              </button>
                              <button 
                                onClick={() => {
                                  setProfessionalToDelete(p);
                                  setDeleteConfirmOpen(true);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-bold uppercase bg-destructive/5 text-destructive hover:bg-destructive/10 transition-all"
                              >
                                <Trash2 size={12} />
                                Excluir
                              </button>
                            </>
                          )}
                          {p.role === 'owner' && <span className="text-[10px] font-bold text-primary uppercase bg-primary/5 px-3 py-1.5 rounded">Proprietária</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "agendamentos" && (
          <div className="premium-card bg-white shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-8 border-b border-border">
              <h3 className="font-serif text-xl text-foreground">Controle de Agendamentos</h3>
              <p className="text-sm text-muted-foreground mt-1">Histórico completo de todas as consultas da clínica.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-secondary/50 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
                  <tr>
                    <th className="px-8 py-5">Data e Horário</th>
                    <th className="px-8 py-5">Paciente</th>
                    <th className="px-8 py-5">Especialista</th>
                    <th className="px-8 py-5 text-center">Status</th>
                    <th className="px-8 py-5 text-right">Faturamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {agendamentos.map(a => (
                    <tr key={a.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-8 py-6 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-primary" />
                          {a.data} às {a.hora.slice(0, 5)}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm font-bold text-foreground">{a.cliente_nome}</div>
                        <div className="text-xs text-muted-foreground">{a.cliente_whatsapp}</div>
                      </td>
                      <td className="px-8 py-6 text-sm text-muted-foreground font-medium">{a.profissional_nome}</td>
                      <td className="px-8 py-6 text-center">
                        <span className={`text-[9px] uppercase font-black px-3 py-1 rounded-full ${
                          a.status === 'confirmado' ? 'bg-primary/10 text-primary' : 
                          a.status === 'concluido' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-foreground text-sm">
                        R$ {a.valor_total?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-white rounded-2xl border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-6 mx-auto">
              <AlertCircle size={32} />
            </div>
            <AlertDialogTitle className="font-serif text-2xl text-center text-foreground">
              Excluir Profissional?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-muted-foreground mt-2 text-base">
              Tem certeza que deseja excluir <strong>{professionalToDelete?.nome}</strong>? Essa ação não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 mt-8">
            <AlertDialogCancel className="w-full sm:flex-1 rounded-xl border-border bg-secondary hover:bg-accent text-foreground font-bold h-12 uppercase text-xs tracking-widest">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="w-full sm:flex-1 rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold h-12 uppercase text-xs tracking-widest transition-all"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, trend }: any) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-border shadow-sm hover:border-primary transition-all duration-300 group">
      <div className="flex justify-between items-start mb-6">
        <div className="h-12 w-12 bg-secondary rounded-xl flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
          <Icon size={24} />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider rounded-full">
          {trend.includes('%') && <ArrowUpRight size={10} />}
          {trend}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-1">{label}</p>
      <p className="text-3xl font-serif text-foreground font-bold">{value}</p>
    </div>
  );
}
