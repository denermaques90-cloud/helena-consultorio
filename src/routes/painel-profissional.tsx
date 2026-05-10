import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LogOut, Calendar, Ban, Settings, Trash2, Plus, MessageCircle, Home, User, Loader2, Lock,
  LayoutDashboard, Users, Search, Menu, X, Clock, CheckCircle2, TrendingUp, CalendarDays, DollarSign,
} from "lucide-react";

export const Route = createFileRoute("/painel-profissional")({
  head: () => ({ meta: [{ title: "Painel Profissional — Clínica Dra. Helena Martins" }] }),
  component: PainelProfissionalPage,
});

type Agendamento = { id: string; cliente_nome: string; cliente_whatsapp: string; data: string; hora: string; servico_ids: string[]; status: string; profissional_nome: string; valor_total: number | null };
type Bloqueio = { id: string; data: string; hora: string | null };
type Profissional = { id: string; nome: string; especialidade: string; whatsapp: string; senha: string };

type TabId = "dashboard" | "agenda" | "pacientes" | "bloqueios" | "config";

function fmtDateBR(iso: string) { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function fullDateBR() {
  return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}

function PainelProfissionalPage() {
  const [prof, setProf] = useState<Profissional | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [servicos, setServicos] = useState<Record<string, string>>({});
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
    (async () => {
      const [{ data: ags }, { data: blq }, { data: svc }] = await Promise.all([
        supabase.from("agendamentos").select("*").eq("profissional_id", prof.id).order("data").order("hora"),
        supabase.from("horarios_bloqueados").select("*").eq("profissional_id", prof.id).order("data"),
        supabase.from("servicos").select("id, nome"),
      ]);
      if (ags) setAgendamentos(ags as Agendamento[]);
      if (blq) setBloqueios(blq as Bloqueio[]);
      if (svc) setServicos(Object.fromEntries((svc as any[]).map(s => [s.id, s.nome])));
    })();
  }, [prof, refreshKey]);

  const reload = () => setRefreshKey(k => k + 1);

  if (loading || !prof) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-card border-r border-border transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-border">
          <h2 className="font-serif text-xl text-primary">Helena Martins</h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Clínica Premium</p>
        </div>
        <nav className="p-4 space-y-2">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "agenda", label: "Agenda", icon: Calendar },
            { id: "pacientes", label: "Pacientes", icon: Users },
            { id: "bloqueios", label: "Bloqueios", icon: Ban },
            { id: "config", label: "Configurações", icon: Settings },
          ].map(item => (
            <button key={item.id} onClick={() => { setTab(item.id as TabId); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium ${tab === item.id ? "bg-primary/10 text-primary border-r-2 border-primary" : "text-muted-foreground hover:bg-muted"}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-border space-y-2">
           <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-primary"><Home size={18} /> Ver Site</Link>
           <button onClick={() => {sessionStorage.clear(); navigate({to: "/entrada"});}} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-destructive"><LogOut size={18} /> Sair</button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border p-6 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu /></button>
          <div>
            <h1 className="font-serif text-2xl">Olá, <span className="text-primary">{prof.nome.split(" ")[0]}</span></h1>
            <p className="text-xs text-muted-foreground capitalize">{fullDateBR()}</p>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto space-y-8">
          {tab === "dashboard" && <DashboardTab agendamentos={agendamentos} bloqueios={bloqueios} />}
          {tab === "agenda" && <AgendaTab agendamentos={agendamentos} servicos={servicos} reload={reload} />}
          {tab === "pacientes" && <div className="premium-card p-10 text-center">Gestão de pacientes</div>}
          {tab === "bloqueios" && <div className="premium-card p-10 text-center">Gestão de bloqueios</div>}
          {tab === "config" && <div className="premium-card p-10 text-center">Configurações de perfil</div>}
        </main>
      </div>
    </div>
  );
}

function DashboardTab({ agendamentos }: any) {
  const today = todayISO();
  const hoje = agendamentos.filter((a: any) => a.data === today);
  const revenue = agendamentos.filter((a: any) => a.status !== "cancelado").reduce((acc: number, a: any) => acc + (a.valor_total || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <MetricCard icon={CalendarDays} label="Agendamentos Hoje" value={hoje.length} />
      <MetricCard icon={DollarSign} label="Faturamento Previsto" value={`R$ ${revenue.toFixed(2)}`} />
      <MetricCard icon={Users} label="Total de Pacientes" value={new Set(agendamentos.map((a:any) => a.cliente_nome)).size} />
      <MetricCard icon={TrendingUp} label="Taxa de Comparecimento" value="92%" />
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: any) {
  return (
    <div className="premium-card p-6 border-l-4 border-l-primary">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center text-primary"><Icon size={20} /></div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</p>
          <p className="font-serif text-2xl mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}

function AgendaTab({ agendamentos, servicos, reload }: any) {
  const today = todayISO();
  const filtered = agendamentos.filter((a: any) => a.data >= today).sort((a:any, b:any) => a.hora.localeCompare(b.hora));
  
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl">Minha Agenda</h2>
      <div className="grid gap-3">
        {filtered.map((a: any) => (
          <div key={a.id} className="premium-card p-5 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="bg-primary/5 px-4 py-2 rounded text-center min-w-[80px] border border-primary/10">
                <p className="text-primary font-bold text-lg">{a.hora.slice(0,5)}</p>
                <p className="text-[10px] uppercase text-primary/60">{fmtDateBR(a.data)}</p>
              </div>
              <div>
                <p className="font-serif text-lg">{a.cliente_nome}</p>
                <p className="text-xs text-muted-foreground">{(a.servico_ids || []).map((id:string) => servicos[id]).join(", ")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
               <span className={`text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-bold ${a.status === 'confirmado' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{a.status}</span>
               <a href={`https://wa.me/${a.cliente_whatsapp.replace(/\D/g,"")}`} target="_blank" className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"><MessageCircle size={20} /></a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
