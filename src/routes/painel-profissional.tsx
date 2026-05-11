import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LogOut, Calendar, Ban, Settings, Plus, MessageCircle, Home, User, Loader2,
  LayoutDashboard, Users, Menu, X, DollarSign, TrendingUp, CalendarDays, Clock, Trash2
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
      supabase.from("agendamentos").select("*").eq("profissional_id", prof.id).order("data").order("hora"),
      supabase.from("horarios_bloqueados").select("*").eq("profissional_id", prof.id).order("data")
    ]).then(([ags, blks]) => {
      if (ags.data) setAgendamentos(ags.data as Agendamento[]);
      if (blks.data) setBloqueios(blks.data as Bloqueio[]);
    });
  }, [prof, refreshKey]);

  if (loading || !prof) return <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center"><Loader2 className="animate-spin text-[#2F8F6F]" /></div>;

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex">
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-[#DCD9D3] transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-6 border-b border-[#DCD9D3]">
          <h2 className="font-serif text-xl text-[#2F8F6F]">Dra. Helena Martins</h2>
        </div>
        <nav className="p-4 space-y-2">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "agenda", label: "Agenda", icon: Calendar },
            { id: "disponibilidade", label: "Disponibilidade", icon: Ban },
            { id: "pacientes", label: "Pacientes", icon: Users },
          ].map(item => (
            <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${tab === item.id ? "bg-[#2F8F6F]/10 text-[#2F8F6F]" : "text-[#6B6B6B] hover:text-[#2F8F6F]"}`}>
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-[#DCD9D3] space-y-2">
           <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#6B6B6B] hover:text-[#2F8F6F]"><Home size={18} /> Ver Site</Link>
           <button onClick={() => {sessionStorage.clear(); navigate({to: "/entrada"});}} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#6B6B6B] hover:text-red-500"><LogOut size={18} /> Sair</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b border-[#DCD9D3] p-6 flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu /></button>
          <div>
            <h1 className="font-serif text-2xl">Olá, {prof.nome.split(" ")[0]}</h1>
            <p className="text-xs text-[#6B6B6B] uppercase tracking-widest font-bold mt-1">Bem-vindo ao seu painel profissional</p>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto">
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-[#DCD9D3] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-[#2F8F6F]/10 rounded flex items-center justify-center text-[#2F8F6F]"><DollarSign size={20} /></div>
          </div>
          <p className="text-[#6B6B6B] text-xs uppercase tracking-widest font-bold mb-1">Faturamento Estimado</p>
          <p className="font-serif text-3xl text-foreground">R$ {revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#DCD9D3] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-[#2F8F6F]/10 rounded flex items-center justify-center text-[#2F8F6F]"><Calendar size={20} /></div>
          </div>
          <p className="text-[#6B6B6B] text-xs uppercase tracking-widest font-bold mb-1">Total de Consultas</p>
          <p className="font-serif text-3xl text-foreground">{agendamentos.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#DCD9D3] shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="h-10 w-10 bg-[#2F8F6F]/10 rounded flex items-center justify-center text-[#2F8F6F]"><Users size={20} /></div>
          </div>
          <p className="text-[#6B6B6B] text-xs uppercase tracking-widest font-bold mb-1">Pacientes Únicos</p>
          <p className="font-serif text-3xl text-foreground">{new Set(agendamentos.map((a:any) => a.cliente_nome)).size}</p>
        </div>
      </div>
    </div>
  );
}

function AgendaTab({ agendamentos, setRefreshKey }: any) {
  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("agendamentos").update({ status }).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else {
      toast.success("Status atualizado");
      setRefreshKey((k: number) => k + 1);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="font-serif text-2xl text-foreground">Agenda de Atendimentos</h2>
      <div className="grid gap-4">
        {agendamentos.length === 0 && <p className="text-muted-foreground italic">Nenhum agendamento encontrado.</p>}
        {agendamentos.map((a: any) => (
          <div key={a.id} className="bg-white p-6 rounded-lg border border-[#DCD9D3] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-serif text-xl text-foreground">{a.cliente_nome}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                <p className="text-sm text-[#6B6B6B] flex items-center gap-1"><Calendar size={14} /> {a.data.split("-").reverse().join("/")}</p>
                <p className="text-sm text-[#6B6B6B] flex items-center gap-1"><Clock size={14} /> {a.hora.slice(0,5)}</p>
                <p className="text-sm text-[#2F8F6F] font-medium">{a.status.toUpperCase()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateStatus(a.id, 'concluido')} className="text-xs uppercase font-bold px-3 py-2 rounded bg-[#2F8F6F]/10 text-[#2F8F6F] hover:bg-[#2F8F6F] hover:text-white transition-all">Concluir</button>
              <button onClick={() => updateStatus(a.id, 'cancelado')} className="text-xs uppercase font-bold px-3 py-2 rounded bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">Cancelar</button>
              <a href={`https://wa.me/${a.cliente_whatsapp.replace(/\D/g,"")}`} className="h-10 w-10 flex items-center justify-center rounded-full bg-[#2F8F6F] text-white hover:opacity-80 transition-opacity"><MessageCircle size={20} /></a>
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