import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LogOut, Calendar, Ban, Settings, Trash2, Plus, MessageCircle, Home, User, Loader2, Lock,
  LayoutDashboard, Users, Search, Menu, X, Clock, CheckCircle2, TrendingUp, CalendarDays,
} from "lucide-react";

export const Route = createFileRoute("/painel-profissional")({
  head: () => ({ meta: [{ title: "Painel — Dra. Helena Martins" }] }),
  component: PainelProfissionalPage,
});

type Agendamento = { id: string; cliente_nome: string; cliente_whatsapp: string; data: string; hora: string; servico_ids: string[]; status: string; profissional_nome: string };
type Bloqueio = { id: string; data: string; hora: string | null };
type Profissional = { id: string; nome: string; especialidade: string; whatsapp: string; senha: string };

type TabId = "dashboard" | "agenda" | "pacientes" | "bloqueios" | "config";

function fmtDateBR(iso: string) { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function isoPlus(days: number) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0,10); }
function fullDateBR() {
  return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
}
function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0,2).map(s => s[0]?.toUpperCase()).join("");
}

function PainelProfissionalPage() {
  const [prof, setProf] = useState<Profissional | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // shared data
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

  function handleLogout() { sessionStorage.clear(); navigate({ to: "/entrada" }); }

  if (loading || !prof) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={28} className="text-gold animate-spin" />
      </div>
    );
  }

  const navItems: { id: TabId | "logout" | "site"; label: string; icon: any; action?: () => void }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "agenda", label: "Agenda", icon: Calendar },
    { id: "pacientes", label: "Pacientes", icon: Users },
    { id: "bloqueios", label: "Horários bloqueados", icon: Ban },
    { id: "config", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[oklch(0.14_0.012_240)] text-foreground flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-[oklch(0.12_0.01_240)] border-r border-border/40 backdrop-blur-xl flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="px-5 py-5 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-gradient-to-br from-gold to-gold-soft flex items-center justify-center text-primary-foreground font-serif text-lg shadow-md shadow-gold/10">
              H
            </div>
            <div className="leading-tight">
              <p className="font-serif text-base text-foreground">Helena Martins</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-gold/80">Consultório</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground p-1">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-border/30">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Profissional</p>
          <p className="text-sm text-foreground mt-1 truncate">{prof.nome}</p>
          <p className="text-xs text-gold/80 mt-0.5 truncate">{prof.especialidade || "Psicólogo(a)"}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id as TabId); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200 ${
                  active
                    ? "bg-gold/10 text-gold border border-gold/20 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border/30 space-y-1">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-all"
          >
            <Home size={16} /> Ver site
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" />
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-[oklch(0.14_0.012_240)]/80 backdrop-blur-xl border-b border-border/40">
          <div className="px-5 lg:px-8 py-4 flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground">
              <Menu size={22} />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-serif text-lg sm:text-xl text-foreground truncate">
                Olá, <span className="text-gold">{prof.nome.split(" ")[0]}</span>
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground capitalize mt-0.5">{fullDateBR()}</p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-white/[0.04] border border-border/40 rounded-md px-3 py-2 w-64">
              <Search size={14} className="text-muted-foreground" />
              <input
                placeholder="Buscar paciente, data..."
                className="bg-transparent outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gold/30 to-petrol/30 border border-gold/20 flex items-center justify-center text-xs font-semibold text-gold">
              {initials(prof.nome)}
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 lg:px-8 py-6 lg:py-8 max-w-[1400px] w-full mx-auto">
          {tab === "dashboard" && <DashboardTab prof={prof} agendamentos={agendamentos} bloqueios={bloqueios} servicos={servicos} setTab={setTab} />}
          {tab === "agenda" && <AgendaTab agendamentos={agendamentos} servicos={servicos} reload={reload} />}
          {tab === "pacientes" && <PacientesTab agendamentos={agendamentos} servicos={servicos} prof={prof} />}
          {tab === "bloqueios" && <BloqueiosTab bloqueios={bloqueios} profissionalId={prof.id} profissionalNome={prof.nome} reload={reload} />}
          {tab === "config" && <ConfigTab prof={prof} onUpdate={setProf} />}
        </main>
      </div>
    </div>
  );
}

/* ============================ DASHBOARD ============================ */

function MetricCard({ icon: Icon, label, value, accent = "gold", hint }: any) {
  const accentMap: Record<string, string> = {
    gold: "text-gold bg-gold/10 border-gold/20",
    petrol: "text-[oklch(0.78_0.06_220)] bg-[oklch(0.32_0.04_220)]/30 border-[oklch(0.32_0.04_220)]/40",
    rose: "text-[oklch(0.78_0.08_30)] bg-[oklch(0.4_0.08_30)]/20 border-[oklch(0.4_0.08_30)]/30",
    emerald: "text-[oklch(0.78_0.08_160)] bg-[oklch(0.32_0.04_160)]/30 border-[oklch(0.32_0.04_160)]/40",
  };
  return (
    <div className="group relative bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-border/40 rounded-xl p-5 backdrop-blur-md hover:border-gold/30 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className="font-serif text-3xl text-foreground mt-2 leading-none">{value}</p>
          {hint && <p className="text-[11px] text-muted-foreground mt-2">{hint}</p>}
        </div>
        <div className={`h-10 w-10 rounded-lg border flex items-center justify-center ${accentMap[accent]}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function DashboardTab({ prof, agendamentos, bloqueios, servicos, setTab }: any) {
  const today = todayISO();
  const week7 = isoPlus(7);

  const hoje = agendamentos.filter((a: Agendamento) => a.data === today);
  const proximos = agendamentos.filter((a: Agendamento) => a.data >= today && a.data <= week7);
  const semana = agendamentos.filter((a: Agendamento) => a.data >= today && a.data <= week7);

  // Bar chart: agendamentos per day for next 7 days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0,10);
    return {
      iso,
      label: d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".",""),
      count: agendamentos.filter((a: Agendamento) => a.data === iso && a.status !== "cancelado").length,
    };
  });
  const max = Math.max(1, ...days.map(d => d.count));

  // Top horários
  const horaCount: Record<string, number> = {};
  agendamentos.forEach((a: Agendamento) => {
    const h = a.hora.slice(0,5);
    horaCount[h] = (horaCount[h] || 0) + 1;
  });
  const topHoras = Object.entries(horaCount).sort((a,b) => b[1] - a[1]).slice(0,5);
  const maxHora = Math.max(1, ...topHoras.map(([,c]) => c));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={CalendarDays} label="Agendamentos hoje" value={hoje.length} accent="gold" hint={hoje.length ? `Próxima às ${hoje[0]?.hora.slice(0,5)}` : "Nenhum hoje"} />
        <MetricCard icon={Clock} label="Próximos 7 dias" value={proximos.length} accent="petrol" hint="Consultas confirmadas" />
        <MetricCard icon={Users} label="Pacientes na semana" value={new Set(semana.map((a: Agendamento) => a.cliente_nome)).size} accent="emerald" />
        <MetricCard icon={Ban} label="Horários bloqueados" value={bloqueios.length} accent="rose" hint="Indisponibilidades" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Agenda preview */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-border/40 rounded-xl backdrop-blur-md">
          <div className="flex items-center justify-between p-5 border-b border-border/30">
            <div>
              <h3 className="font-serif text-lg text-foreground">Próximas consultas</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Sua agenda nos próximos dias</p>
            </div>
            <button onClick={() => setTab("agenda")} className="text-xs text-gold hover:text-gold-soft transition">Ver tudo →</button>
          </div>
          <div className="divide-y divide-border/20">
            {proximos.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground italic">Nenhuma consulta nos próximos dias.</div>
            )}
            {proximos.slice(0, 6).map((a: Agendamento) => (
              <div key={a.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition">
                <div className="text-center min-w-[52px]">
                  <p className="text-[10px] uppercase text-muted-foreground tracking-wider">{new Date(a.data + "T00:00").toLocaleDateString("pt-BR", { month: "short" }).replace(".","")}</p>
                  <p className="font-serif text-xl text-gold leading-none">{a.data.slice(8,10)}</p>
                </div>
                <div className="h-10 w-px bg-border/40" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{a.cliente_nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {a.hora.slice(0,5)} · {(a.servico_ids || []).map(id => servicos[id]).filter(Boolean).join(", ") || "Consulta"}
                  </p>
                </div>
                <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  a.status === "confirmado" ? "bg-gold/10 text-gold border-gold/30" :
                  a.status === "cancelado" ? "bg-destructive/10 text-destructive border-destructive/30" :
                  "bg-white/5 text-muted-foreground border-border/40"
                }`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-border/40 rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-serif text-lg text-foreground">Agendamentos / semana</h3>
            <TrendingUp size={16} className="text-gold/60" />
          </div>
          <p className="text-xs text-muted-foreground mb-6">Próximos 7 dias</p>
          <div className="flex items-end justify-between gap-2 h-40">
            {days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-[10px] text-muted-foreground">{d.count}</div>
                <div className="w-full bg-white/[0.03] rounded-md overflow-hidden flex items-end" style={{ height: "100%" }}>
                  <div
                    className="w-full bg-gradient-to-t from-gold/40 to-gold/80 rounded-md transition-all duration-700"
                    style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? "6px" : "0px" }}
                  />
                </div>
                <div className="text-[10px] uppercase text-muted-foreground tracking-wider">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top horários */}
      <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-border/40 rounded-xl p-5 backdrop-blur-md">
        <h3 className="font-serif text-lg text-foreground">Horários mais procurados</h3>
        <p className="text-xs text-muted-foreground mt-0.5 mb-5">Distribuição histórica das suas sessões</p>
        {topHoras.length === 0 ? (
          <div className="text-sm text-muted-foreground italic py-6 text-center">Sem dados ainda.</div>
        ) : (
          <div className="space-y-3">
            {topHoras.map(([hora, count]) => (
              <div key={hora} className="flex items-center gap-4">
                <div className="text-sm text-foreground w-14 font-medium">{hora}</div>
                <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-gold/70 to-gold-soft rounded-full transition-all duration-700" style={{ width: `${(count/maxHora)*100}%` }} />
                </div>
                <div className="text-xs text-muted-foreground w-10 text-right">{count}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ AGENDA ============================ */

function AgendaTab({ agendamentos, servicos, reload }: any) {
  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("agendamentos").update({ status }).eq("id", id);
    if (error) return toast.error("Erro ao atualizar");
    toast.success("Status atualizado");
    reload();
  }
  async function remove(id: string) {
    if (!confirm("Remover este agendamento?")) return;
    await supabase.from("agendamentos").delete().eq("id", id);
    toast.success("Agendamento removido");
    reload();
  }

  const today = todayISO();
  const upcoming = agendamentos.filter((i: Agendamento) => i.data >= today);
  const past = agendamentos.filter((i: Agendamento) => i.data < today);

  // group upcoming by date
  const grouped: Record<string, Agendamento[]> = {};
  upcoming.forEach((a: Agendamento) => { (grouped[a.data] = grouped[a.data] || []).push(a); });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="font-serif text-2xl text-foreground">Agenda</h2>
        <p className="text-sm text-muted-foreground mt-1">Visualize e gerencie suas consultas.</p>
      </div>

      {Object.keys(grouped).length === 0 && (
        <div className="bg-white/[0.03] border border-border/40 rounded-xl p-10 text-center text-sm text-muted-foreground italic">
          Nenhuma consulta agendada.
        </div>
      )}

      {Object.entries(grouped).map(([data, lista]) => (
        <div key={data} className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-border/40 rounded-xl backdrop-blur-md">
          <div className="px-5 py-4 border-b border-border/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-gold" />
              <h3 className="font-serif text-base text-foreground capitalize">
                {new Date(data + "T00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              </h3>
            </div>
            <span className="text-xs text-muted-foreground">{lista.length} {lista.length === 1 ? "consulta" : "consultas"}</span>
          </div>
          <div className="divide-y divide-border/20">
            {lista.sort((a,b) => a.hora.localeCompare(b.hora)).map(a => (
              <div key={a.id} className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/[0.02] transition">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="bg-gold/10 border border-gold/20 rounded-lg px-3 py-2 text-center min-w-[70px]">
                    <p className="font-serif text-base text-gold leading-none">{a.hora.slice(0,5)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{a.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {(a.servico_ids || []).map(id => servicos[id]).filter(Boolean).join(", ") || "Consulta"}
                    </p>
                  </div>
                  <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border whitespace-nowrap ${
                    a.status === "confirmado" ? "bg-gold/10 text-gold border-gold/30" :
                    a.status === "cancelado" ? "bg-destructive/10 text-destructive border-destructive/30" :
                    a.status === "concluido" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                    "bg-white/5 text-muted-foreground border-border/40"
                  }`}>{a.status}</span>
                </div>
                <div className="flex items-center gap-2 md:border-l md:border-border/30 md:pl-4">
                  <a href={`https://wa.me/${a.cliente_whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                    className="p-2 rounded-md bg-white/[0.04] text-gold hover:bg-gold hover:text-primary-foreground transition" title="WhatsApp">
                    <MessageCircle size={15} />
                  </a>
                  {a.status !== "concluido" && (
                    <button onClick={() => setStatus(a.id, "concluido")} className="text-xs px-3 py-2 rounded-md border border-border/40 hover:border-emerald-500/40 hover:text-emerald-400 transition">
                      <CheckCircle2 size={14} />
                    </button>
                  )}
                  {a.status !== "cancelado" && (
                    <button onClick={() => setStatus(a.id, "cancelado")} className="text-xs px-3 py-2 rounded-md border border-border/40 hover:border-destructive/40 hover:text-destructive transition">Cancelar</button>
                  )}
                  <button onClick={() => remove(a.id)} className="p-2 rounded-md border border-border/40 text-muted-foreground hover:text-destructive hover:border-destructive/40 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {past.length > 0 && (
        <details className="bg-white/[0.02] border border-border/30 rounded-xl">
          <summary className="cursor-pointer px-5 py-4 text-sm text-muted-foreground hover:text-foreground select-none">
            Histórico ({past.length})
          </summary>
          <div className="divide-y divide-border/20">
            {past.map(a => (
              <div key={a.id} className="p-4 flex items-center gap-4 opacity-70">
                <div className="text-xs text-muted-foreground w-24">{fmtDateBR(a.data)}</div>
                <div className="text-xs text-muted-foreground w-14">{a.hora.slice(0,5)}</div>
                <div className="flex-1 text-sm text-foreground truncate">{a.cliente_nome}</div>
                <span className="text-[10px] uppercase text-muted-foreground">{a.status}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

/* ============================ PACIENTES ============================ */

function PacientesTab({ agendamentos, servicos, prof }: any) {
  const [q, setQ] = useState("");
  const pacientes = useMemo(() => {
    const map: Record<string, { nome: string; whatsapp: string; ultimaData: string; ultimoServico: string; total: number }> = {};
    agendamentos.forEach((a: Agendamento) => {
      const key = a.cliente_nome.toLowerCase().trim();
      const svc = (a.servico_ids || []).map(id => servicos[id]).filter(Boolean).join(", ") || "Consulta";
      if (!map[key]) map[key] = { nome: a.cliente_nome, whatsapp: a.cliente_whatsapp, ultimaData: a.data, ultimoServico: svc, total: 1 };
      else {
        map[key].total += 1;
        if (a.data > map[key].ultimaData) { map[key].ultimaData = a.data; map[key].ultimoServico = svc; }
      }
    });
    return Object.values(map).sort((a,b) => b.ultimaData.localeCompare(a.ultimaData));
  }, [agendamentos, servicos]);

  const filtered = pacientes.filter(p => p.nome.toLowerCase().includes(q.toLowerCase()) || p.whatsapp.includes(q));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-foreground">Pacientes</h2>
          <p className="text-sm text-muted-foreground mt-1">{pacientes.length} {pacientes.length === 1 ? "paciente atendido" : "pacientes atendidos"}.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/[0.04] border border-border/40 rounded-md px-3 py-2 w-full md:w-72">
          <Search size={14} className="text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome ou telefone..." className="bg-transparent outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground/60" />
        </div>
      </div>

      <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-border/40 rounded-xl overflow-hidden backdrop-blur-md">
        <div className="hidden md:grid grid-cols-[2fr_1.3fr_1.3fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border/30 text-[10px] uppercase tracking-wider text-muted-foreground">
          <div>Paciente</div><div>WhatsApp</div><div>Modalidade</div><div>Última visita</div><div>Profissional</div><div></div>
        </div>
        <div className="divide-y divide-border/20">
          {filtered.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground italic">Nenhum paciente encontrado.</div>}
          {filtered.map(p => (
            <div key={p.nome} className="grid grid-cols-1 md:grid-cols-[2fr_1.3fr_1.3fr_1fr_1fr_auto] gap-2 md:gap-4 px-5 py-4 items-center hover:bg-white/[0.02] transition">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gold/30 to-petrol/30 border border-gold/20 flex items-center justify-center text-[11px] font-semibold text-gold shrink-0">{initials(p.nome)}</div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{p.nome}</p>
                  <p className="text-[10px] text-muted-foreground">{p.total} {p.total === 1 ? "consulta" : "consultas"}</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground truncate">{p.whatsapp}</div>
              <div className="text-xs text-foreground/80 truncate">{p.ultimoServico}</div>
              <div className="text-xs text-muted-foreground">{fmtDateBR(p.ultimaData)}</div>
              <div className="text-xs text-gold/80 truncate">{prof.nome.split(" ")[0]}</div>
              <a href={`https://wa.me/${p.whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="justify-self-end p-2 rounded-md bg-white/[0.04] text-gold hover:bg-gold hover:text-primary-foreground transition">
                <MessageCircle size={14} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================ BLOQUEIOS ============================ */

function BloqueiosTab({ bloqueios, profissionalId, profissionalNome, reload }: any) {
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [diaInteiro, setDiaInteiro] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return toast.error("Selecione uma data");
    if (!diaInteiro && !hora) return toast.error("Informe o horário ou marque dia inteiro");
    const { error } = await supabase.from("horarios_bloqueados").insert({
      data, hora: diaInteiro ? null : hora, profissional_id: profissionalId, profissional_nome: profissionalNome,
    });
    if (error) return toast.error("Erro ao adicionar bloqueio");
    toast.success("Bloqueio adicionado");
    setData(""); setHora(""); setDiaInteiro(false);
    reload();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("horarios_bloqueados").delete().eq("id", id);
    if (error) return toast.error("Erro ao remover");
    toast.success("Bloqueio removido");
    reload();
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="font-serif text-2xl text-foreground">Horários bloqueados</h2>
        <p className="text-sm text-muted-foreground mt-1">Evite agendamentos em horários ou datas específicas.</p>
      </div>

      <form onSubmit={add} className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-border/40 rounded-xl p-5 backdrop-blur-md grid gap-4 md:grid-cols-4 items-end">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Data</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)} className="w-full bg-white/[0.04] border border-border/40 rounded-md px-3 py-2.5 text-sm outline-none focus:border-gold transition" />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Horário</label>
          <input type="time" value={hora} disabled={diaInteiro} onChange={e => setHora(e.target.value)} className="w-full bg-white/[0.04] border border-border/40 rounded-md px-3 py-2.5 text-sm outline-none focus:border-gold transition disabled:opacity-30" />
        </div>
        <label className="flex items-center gap-3 text-sm text-foreground cursor-pointer select-none py-2.5">
          <input type="checkbox" checked={diaInteiro} onChange={e => setDiaInteiro(e.target.checked)} className="h-4 w-4 accent-gold" />
          <span>Dia inteiro</span>
        </label>
        <button className="rounded-md bg-gold py-2.5 text-sm font-semibold text-primary-foreground hover:bg-gold/90 transition flex items-center justify-center gap-2">
          <Plus size={16} /> Adicionar
        </button>
      </form>

      <div className="grid gap-2">
        {bloqueios.length === 0 ? (
          <div className="bg-white/[0.03] border border-border/30 rounded-xl p-10 text-center text-sm text-muted-foreground italic">Você não possui bloqueios ativos.</div>
        ) : (
          bloqueios.map((b: Bloqueio) => (
            <div key={b.id} className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-border/40 rounded-xl p-4 flex items-center justify-between group hover:border-gold/30 transition">
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 rounded-md bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center">
                  <Ban size={16} />
                </div>
                <div>
                  <p className="text-sm text-foreground">{fmtDateBR(b.data)}</p>
                  <p className="text-xs text-muted-foreground">{b.hora ? `Horário: ${b.hora.slice(0,5)}` : <span className="text-gold">Dia inteiro</span>}</p>
                </div>
              </div>
              <button onClick={() => remove(b.id)} className="p-2 text-muted-foreground hover:text-destructive opacity-50 group-hover:opacity-100 transition">
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ============================ CONFIG ============================ */

function ConfigTab({ prof, onUpdate }: { prof: Profissional; onUpdate: (p: Profissional) => void }) {
  const [form, setForm] = useState<Profissional>(prof);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profissionais").update({
      nome: form.nome, especialidade: form.especialidade, whatsapp: form.whatsapp, senha: form.senha,
    }).eq("id", form.id);
    setSaving(false);
    if (error) return toast.error("Erro ao salvar");
    toast.success("Perfil atualizado");
    onUpdate(form);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="font-serif text-2xl text-foreground">Configurações</h2>
        <p className="text-sm text-muted-foreground mt-1">Atualize seus dados de acesso e contato.</p>
      </div>

      <form onSubmit={save} className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-border/40 rounded-xl p-6 md:p-8 max-w-3xl backdrop-blur-md space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Nome exibido</label>
            <input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full bg-white/[0.04] border border-border/40 rounded-md px-4 py-3 text-sm text-foreground outline-none focus:border-gold transition" />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Especialidade</label>
            <input value={form.especialidade} onChange={e => setForm({...form, especialidade: e.target.value})} className="w-full bg-white/[0.04] border border-border/40 rounded-md px-4 py-3 text-sm text-foreground outline-none focus:border-gold transition" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">WhatsApp</label>
          <input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} placeholder="5511999999999" className="w-full bg-white/[0.04] border border-border/40 rounded-md px-4 py-3 text-sm text-foreground outline-none focus:border-gold transition" />
          <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">Os pacientes entrarão em contato por aqui.</p>
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Senha de acesso</label>
          <div className="relative">
            <input type="text" value={form.senha} onChange={e => setForm({...form, senha: e.target.value})} className="w-full bg-white/[0.04] border border-border/40 rounded-md px-4 py-3 pr-10 text-sm text-foreground outline-none focus:border-gold transition" />
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={14} />
          </div>
        </div>
        <div className="pt-4 border-t border-border/30">
          <button disabled={saving} className="px-8 rounded-md bg-gold py-3 text-sm font-semibold text-primary-foreground hover:bg-gold/90 transition flex items-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
