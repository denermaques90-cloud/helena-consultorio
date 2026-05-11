import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LogOut, Calendar, Ban, Settings, Plus, MessageCircle, Home, User, Loader2,
  LayoutDashboard, Users, Menu, X, DollarSign, TrendingUp, CalendarDays, Clock, Trash2,
  ChevronRight, ArrowLeft
} from "lucide-react";

export const Route = createFileRoute("/painel-profissional")({
  head: () => ({ meta: [{ title: "Painel Profissional - Dra. Helena Martins" }] }),
  component: PainelProfissionalPage,
});

type Agendamento = { id: string; cliente_nome: string; cliente_whatsapp: string; data: string; hora: string; servico_ids: string[]; status: string; profissional_nome: string; valor_total: number | null };
type Profissional = { id: string; nome: string; especialidade: string | null; whatsapp: string | null; senha: string };
type Bloqueio = { id: string; data: string; hora: string | null };

function PainelProfissionalPage() {
  const [prof, setProf] = useState<Profissional | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const id = sessionStorage.getItem("profissional_id");
    if (!id) { navigate({ to: "/profissional" }); return; }
    supabase.from("profissionais").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (!data) { sessionStorage.clear(); navigate({ to: "/profissional" }); return; }
      setProf(data as Profissional);
      setLoading(false);
    });
  }, [navigate]);

  useEffect(() => {
    if (!prof) return;
    Promise.all([
      supabase.from("agendamentos").select("*").eq("profissional_id", prof.id).order("data", { ascending: false }).order("hora", { ascending: false }),
      supabase.from("horarios_bloqueados").select("*").eq("profissional_id", prof.id).order("data", { ascending: false })
    ]).then(([ags, blks]) => {
      if (ags.data) setAgendamentos(ags.data as Agendamento[]);
      if (blks.data) setBloqueios(blks.data as Bloqueio[]);
    });
  }, [prof, refreshKey]);

  if (loading || !prof) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-72 bg-white border-r border-border transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-8 mb-4">
          <h2 className="font-sans font-extrabold text-2xl text-primary leading-tight tracking-tighter">Dra. Helena Martins</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black mt-1">Painel Profissional</p>
        </div>
        <nav className="px-4 space-y-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "agenda", label: "Minha Agenda", icon: Calendar },
            { id: "disponibilidade", label: "Disponibilidade", icon: Ban },
            { id: "pacientes", label: "Meus Pacientes", icon: Users },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => { setTab(item.id); setSidebarOpen(false); }} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === item.id 
                  ? "bg-primary/10 text-primary shadow-sm font-semibold" 
                  : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              }`}
            >
              <item.icon size={18} className={tab === item.id ? "text-primary" : "text-muted-foreground"} /> 
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-border bg-white space-y-1">
           <Link to="/" className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"><Home size={18} /> Ver Site Público</Link>
           <button onClick={() => {sessionStorage.clear(); navigate({to: "/entrada"});}} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-muted-foreground hover:text-destructive transition-colors"><LogOut size={18} /> Sair do Painel</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-border p-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-secondary rounded-md transition-colors"><Menu size={20} /></button>
            <div>
              <h1 className="font-sans font-extrabold text-3xl text-foreground tracking-tighter">Olá, {prof.nome.split(" ")[0]}</h1>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">Gestão de Atendimentos</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-full border border-border">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Status Online</span>
          </div>
        </header>

        <main className="p-6 md:p-10 lg:p-12 max-w-7xl mx-auto">
          {tab === "dashboard" && <DashboardTab agendamentos={agendamentos} />}
          {tab === "agenda" && <AgendaTab agendamentos={agendamentos} setRefreshKey={setRefreshKey} />}
          {tab === "disponibilidade" && <DisponibilidadeTab prof={prof} bloqueios={bloqueios} setRefreshKey={setRefreshKey} />}
          {tab === "pacientes" && <PacientesTab agendamentos={agendamentos} />}
        </main>
      </div>
    </div>
  );
}


function DashboardTab({ agendamentos }: any) {
  const confirmed = agendamentos.filter((a: any) => a.status === "confirmado" || a.status === "concluido");
  const revenue = confirmed.reduce((acc: number, a: any) => acc + (a.valor_total || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard label="Faturamento Estimado" value={`R$ ${revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} icon={DollarSign} trend="Mensal" />
        <MetricCard label="Total de Consultas" value={agendamentos.length} icon={Calendar} trend="+2.5%" />
        <MetricCard label="Pacientes Ativos" value={new Set(agendamentos.map((a:any) => a.cliente_nome)).size} icon={Users} trend="Fidelizados" />
      </div>
      
      <div className="premium-card p-8 bg-white">
        <h3 className="font-sans font-bold text-xl text-foreground mb-6 tracking-tight">Próximos Atendimentos</h3>
        <div className="space-y-4">
          {agendamentos.filter((a:any) => a.status === 'confirmado').slice(0, 3).map((a:any) => (
            <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {a.cliente_nome.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{a.cliente_nome}</div>
                  <div className="text-xs text-muted-foreground">{a.data.split("-").reverse().join("/")} às {a.hora.slice(0,5)}</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </div>
          ))}
          {agendamentos.filter((a:any) => a.status === 'confirmado').length === 0 && (
            <p className="text-center py-10 text-muted-foreground italic text-sm">Sem novos agendamentos confirmados.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, trend }: any) {
  return (
    <div className="bg-white p-7 rounded-2xl border border-border shadow-sm hover:border-primary transition-all duration-300 group">
      <div className="flex justify-between items-start mb-6">
        <div className="h-11 w-11 bg-secondary/50 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
          <Icon size={22} />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider rounded-full">
          {trend}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1">{label}</p>
      <p className="text-3xl font-sans font-extrabold text-foreground tracking-tighter">{value}</p>
    </div>
  );
}

function AgendaTab({ agendamentos, setRefreshKey }: any) {
  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("agendamentos").update({ status }).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else {
      toast.success("Status atualizado com sucesso");
      setRefreshKey((k: number) => k + 1);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="font-sans font-extrabold text-2xl text-foreground tracking-tighter">Agenda de Atendimentos</h2>
          <p className="text-sm text-muted-foreground font-medium">Gerencie suas consultas e acompanhe o status dos pacientes.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {agendamentos.length === 0 && (
          <div className="premium-card p-20 text-center bg-white">
            <Calendar size={48} className="text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground italic">Nenhum agendamento encontrado.</p>
          </div>
        )}
        {agendamentos.map((a: any) => (
          <div key={a.id} className="bg-white p-6 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary transition-all group">
            <div className="flex items-center gap-5">
              <div className={`h-14 w-14 rounded-2xl flex flex-col items-center justify-center border transition-colors ${
                a.status === 'confirmado' ? "bg-primary/5 border-primary/20 text-primary" : "bg-secondary border-border text-muted-foreground"
              }`}>
                <span className="text-xs font-black uppercase">{a.data.split("-")[2]}</span>
                <span className="text-[10px] uppercase opacity-60 font-bold">{a.data.split("-")[1] === '05' ? 'MAI' : 'MÊS'}</span>
              </div>
              <div>
                <p className="font-serif text-xl text-foreground group-hover:text-primary transition-colors">{a.cliente_nome}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><Clock size={12} className="text-primary" /> {a.hora.slice(0,5)}</p>
                  <p className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    a.status === 'confirmado' ? 'bg-primary/10 text-primary' : 
                    a.status === 'concluido' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                  }`}>{a.status}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {a.status === 'confirmado' && (
                <>
                  <button onClick={() => updateStatus(a.id, 'concluido')} className="flex-1 md:flex-none text-[10px] uppercase font-black tracking-widest px-5 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-all shadow-sm">Concluir</button>
                  <button onClick={() => updateStatus(a.id, 'cancelado')} className="flex-1 md:flex-none text-[10px] uppercase font-black tracking-widest px-5 py-2.5 rounded-lg bg-destructive/5 text-destructive hover:bg-destructive/10 transition-all">Cancelar</button>
                </>
              )}
              <a 
                href={`https://wa.me/${a.cliente_whatsapp.replace(/\D/g,"")}`} 
                target="_blank"
                rel="noreferrer"
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary text-primary hover:bg-primary hover:text-white transition-all shadow-sm border border-border group/wa"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function DisponibilidadeTab({ prof, bloqueios, setRefreshKey }: any) {
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleBloquear(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setLoading(true);
    const { error } = await supabase.from("horarios_bloqueados").insert({
      profissional_id: prof.id,
      profissional_nome: prof.nome,
      data,
      hora: hora || null
    });
    setLoading(false);
    if (error) toast.error("Erro ao bloquear");
    else {
      toast.success(hora ? "Horário bloqueado" : "Dia bloqueado");
      setRefreshKey((k: number) => k + 1);
      setData(""); setHora("");
    }
  }

  async function removeBloqueio(id: string) {
    const { error } = await supabase.from("horarios_bloqueados").delete().eq("id", id);
    if (error) toast.error("Erro ao remover");
    else {
      toast.success("Bloqueio removido");
      setRefreshKey((k: number) => k + 1);
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="premium-card p-10 bg-white shadow-sm border-primary/10">
        <h2 className="font-sans font-extrabold text-2xl text-foreground mb-2 tracking-tighter">Gerenciar Disponibilidade</h2>
        <p className="text-sm text-muted-foreground mb-8 font-medium">Bloqueie datas ou horários específicos para impedir novos agendamentos.</p>
        
        <form onSubmit={handleBloquear} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
              <CalendarDays size={12} className="text-primary" /> Data do Bloqueio
            </label>
            <input 
              type="date" 
              required 
              value={data} 
              onChange={e => setData(e.target.value)} 
              className="w-full bg-secondary/50 border border-border rounded-xl p-4 outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-2">
              <Clock size={12} className="text-primary" /> Horário (Opcional)
            </label>
            <input 
              type="time" 
              value={hora} 
              onChange={e => setHora(e.target.value)} 
              className="w-full bg-secondary/50 border border-border rounded-xl p-4 outline-none focus:border-primary focus:bg-white transition-all text-sm font-medium" 
            />
            <p className="text-[10px] text-muted-foreground opacity-70 italic">Vazio = Bloqueia o dia inteiro</p>
          </div>
          <div className="flex items-end">
            <button 
              disabled={loading} 
              className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Confirmar Bloqueio"}
            </button>
          </div>
        </form>
      </div>

      <div className="premium-card bg-white shadow-sm overflow-hidden border-border">
        <div className="p-8 border-b border-border bg-secondary/10">
          <h3 className="font-serif text-xl text-foreground">Bloqueios Ativos na Agenda</h3>
          <p className="text-xs text-muted-foreground mt-1">Lista de períodos indisponíveis para agendamento público.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-secondary/40 text-[11px] uppercase tracking-widest font-bold text-muted-foreground border-b border-border">
              <tr>
                <th className="px-8 py-5">Data do Evento</th>
                <th className="px-8 py-5">Tipo de Bloqueio</th>
                <th className="px-8 py-5 text-center">Horário</th>
                <th className="px-8 py-5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bloqueios.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-muted-foreground italic text-sm">
                    Nenhum bloqueio registrado no momento.
                  </td>
                </tr>
              )}
              {bloqueios.map((b: Bloqueio) => (
                <tr key={b.id} className="hover:bg-secondary/10 transition-colors group">
                  <td className="px-8 py-6 text-sm font-bold text-foreground">
                    {b.data.split("-").reverse().join("/")}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${b.hora ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}`}>
                      {b.hora ? "Horário Específico" : "Indisponibilidade Total"}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm text-center font-medium text-muted-foreground">
                    {b.hora?.slice(0, 5) || "O dia todo"}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => removeBloqueio(b.id)} 
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                      title="Remover bloqueio"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PacientesTab({ agendamentos }: any) {
  const pacientes = useMemo(() => {
    const map = new Map();
    agendamentos.forEach((a: any) => {
      if (!map.has(a.cliente_nome)) {
        map.set(a.cliente_nome, {
          nome: a.cliente_nome,
          whatsapp: a.cliente_whatsapp,
          consultas: 0,
          ultima: a.data
        });
      }
      const p = map.get(a.cliente_nome);
      p.consultas++;
      if (a.data > p.ultima) p.ultima = a.data;
    });
    return Array.from(map.values());
  }, [agendamentos]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="mb-4">
        <h2 className="font-sans font-extrabold text-2xl text-foreground tracking-tighter">Meus Pacientes</h2>
        <p className="text-sm text-muted-foreground font-medium">Base de contatos e histórico de atendimentos realizados.</p>
      </div>

      <div className="premium-card bg-white shadow-sm overflow-hidden border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-secondary/40 text-[11px] uppercase tracking-widest font-bold text-muted-foreground border-b border-border">
              <tr>
                <th className="px-8 py-5">Identificação</th>
                <th className="px-8 py-5 text-center">Frequência</th>
                <th className="px-8 py-5">Última Sessão</th>
                <th className="px-8 py-5 text-right">Comunicação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pacientes.map((p: any) => (
                <tr key={p.nome} className="hover:bg-secondary/10 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {p.nome.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-sm font-bold text-foreground">{p.nome}</div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm text-center font-medium">
                    {p.consultas} {p.consultas === 1 ? 'sessão' : 'sessões'}
                  </td>
                  <td className="px-8 py-6 text-sm text-muted-foreground font-medium">
                    {p.ultima.split("-").reverse().join("/")}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <a 
                      href={`https://wa.me/${p.whatsapp.replace(/\D/g,"")}`} 
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-bold text-[10px] uppercase tracking-widest bg-primary/5 px-4 py-2 rounded-lg transition-all"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
