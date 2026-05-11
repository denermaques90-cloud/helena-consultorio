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
          <h2 className="font-serif text-2xl text-primary leading-tight">Dra. Helena Martins</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mt-1">Painel Profissional</p>
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
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg text-sm font-semibold transition-all ${
                tab === item.id 
                  ? "bg-primary/5 text-primary shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
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
              <h1 className="font-serif text-2xl text-foreground">Olá, {prof.nome.split(" ")[0]}</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">Gestão de Atendimentos</p>
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
        <h3 className="font-serif text-xl text-foreground mb-6">Próximos Atendimentos</h3>
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
    <div className="bg-white p-8 rounded-2xl border border-border shadow-sm hover:border-primary transition-all duration-300 group">
      <div className="flex justify-between items-start mb-6">
        <div className="h-12 w-12 bg-secondary rounded-xl flex items-center justify-center text-primary group-hover:bg-primary/10 transition-colors">
          <Icon size={24} />
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider rounded-full">
          {trend}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black mb-1">{label}</p>
      <p className="text-3xl font-serif text-foreground font-bold">{value}</p>
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
          <h2 className="font-serif text-2xl text-foreground">Agenda de Atendimentos</h2>
          <p className="text-sm text-muted-foreground">Gerencie suas consultas e acompanhe o status dos pacientes.</p>
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="premium-card p-6 bg-white">
        <h2 className="font-serif text-2xl text-foreground mb-6">Gerenciar Bloqueios</h2>
        <form onSubmit={handleBloquear} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-[#6B6B6B] block mb-2 tracking-widest">Data</label>
            <input type="date" required value={data} onChange={e => setData(e.target.value)} className="w-full bg-[#F4F1EA] border border-[#DCD9D3] rounded p-3 outline-none focus:border-[#2F8F6F]" />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-[#6B6B6B] block mb-2 tracking-widest">Horário (Opcional)</label>
            <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="w-full bg-[#F4F1EA] border border-[#DCD9D3] rounded p-3 outline-none focus:border-[#2F8F6F]" />
            <p className="text-[10px] text-muted-foreground mt-1">Deixe vazio para bloquear o dia inteiro.</p>
          </div>
          <div className="flex items-end">
            <button disabled={loading} className="w-full bg-[#2F8F6F] text-white py-3 rounded font-bold hover:bg-[#2F8F6F]/90 transition-all">
              {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Adicionar Bloqueio"}
            </button>
          </div>
        </form>
      </div>

      <div className="premium-card bg-white overflow-hidden">
        <div className="p-6 border-b border-[#DCD9D3]">
          <h3 className="font-serif text-xl">Bloqueios Ativos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F4F1EA] text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B]">
              <tr>
                <th className="p-4">Data</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Horário</th>
                <th className="p-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCD9D3]">
              {bloqueios.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">Nenhum bloqueio registrado.</td></tr>}
              {bloqueios.map((b: Bloqueio) => (
                <tr key={b.id} className="hover:bg-[#F7F5F0]/50 transition-colors">
                  <td className="p-4 text-sm">{b.data.split("-").reverse().join("/")}</td>
                  <td className="p-4 text-sm font-medium">{b.hora ? "Horário Único" : "Dia Inteiro"}</td>
                  <td className="p-4 text-sm">{b.hora?.slice(0, 5) || "---"}</td>
                  <td className="p-4">
                    <button onClick={() => removeBloqueio(b.id)} className="text-red-500 hover:text-red-700 transition-colors"><Trash2 size={18} /></button>
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
      <h2 className="font-serif text-2xl text-foreground">Sua Lista de Pacientes</h2>
      <div className="premium-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#F4F1EA] text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B]">
              <tr>
                <th className="p-4">Nome</th>
                <th className="p-4">Consultas</th>
                <th className="p-4">Último Atendimento</th>
                <th className="p-4">Contato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCD9D3]">
              {pacientes.map((p: any) => (
                <tr key={p.nome} className="hover:bg-[#F7F5F0]/50 transition-colors">
                  <td className="p-4 font-medium">{p.nome}</td>
                  <td className="p-4 text-sm">{p.consultas} sessões</td>
                  <td className="p-4 text-sm">{p.ultima.split("-").reverse().join("/")}</td>
                  <td className="p-4">
                    <a href={`https://wa.me/${p.whatsapp.replace(/\D/g,"")}`} className="text-[#2F8F6F] hover:underline font-bold text-xs uppercase tracking-widest">WhatsApp</a>
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