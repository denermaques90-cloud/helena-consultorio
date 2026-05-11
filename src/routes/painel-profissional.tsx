import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LogOut, Calendar, Ban, Settings, Plus, MessageCircle, Home, User, Loader2,
  LayoutDashboard, Users, Menu, X, DollarSign, TrendingUp, CalendarDays,
} from "lucide-react";

export const Route = createFileRoute("/painel-profissional")({
  head: () => ({ meta: [{ title: "Painel Profissional - Dra. Helena Martins" }] }),
  component: PainelProfissionalPage,
});

type Agendamento = { id: string; cliente_nome: string; cliente_whatsapp: string; data: string; hora: string; servico_ids: string[]; status: string; profissional_nome: string; valor_total: number | null };
type Profissional = { id: string; nome: string; especialidade: string | null; whatsapp: string | null; senha: string };

function PainelProfissionalPage() {
  const [prof, setProf] = useState<Profissional | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
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
    supabase.from("agendamentos").select("*").eq("profissional_id", prof.id).order("data").order("hora")
      .then(({ data }) => { if (data) setAgendamentos(data as Agendamento[]); });
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
        <header className="bg-white border-b border-[#DCD9D3] p-6 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu /></button>
          <div>
            <h1 className="font-serif text-2xl">Olá, {prof.nome.split(" ")[0]}</h1>
            <p className="text-xs text-[#6B6B6B] uppercase tracking-widest font-bold mt-1">Bem-vindo de volta</p>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto">
          {tab === "dashboard" && <DashboardTab agendamentos={agendamentos} />}
          {tab === "agenda" && <AgendaTab agendamentos={agendamentos} />}
        </main>
      </div>
    </div>
  );
}

function DashboardTab({ agendamentos }: any) {
  const revenue = agendamentos.filter((a: any) => a.status === "confirmado" || a.status === "concluido").reduce((acc: number, a: any) => acc + (a.valor_total || 0), 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg border border-[#DCD9D3] shadow-sm">
        <p className="text-[#6B6B6B] text-xs uppercase font-bold mb-1">Faturamento Acumulado</p>
        <p className="font-serif text-3xl">R$ {revenue.toFixed(2)}</p>
      </div>
      <div className="bg-white p-6 rounded-lg border border-[#DCD9D3] shadow-sm">
        <p className="text-[#6B6B6B] text-xs uppercase font-bold mb-1">Agendamentos Totais</p>
        <p className="font-serif text-3xl">{agendamentos.length}</p>
      </div>
      <div className="bg-white p-6 rounded-lg border border-[#DCD9D3] shadow-sm">
        <p className="text-[#6B6B6B] text-xs uppercase font-bold mb-1">Pacientes Atendidos</p>
        <p className="font-serif text-3xl">{new Set(agendamentos.map((a:any) => a.cliente_nome)).size}</p>
      </div>
    </div>
  );
}

function AgendaTab({ agendamentos }: any) {
  return (
    <div className="space-y-4">
      <h2 className="font-serif text-2xl mb-6">Sua Agenda</h2>
      <div className="grid gap-3">
        {agendamentos.map((a: any) => (
          <div key={a.id} className="bg-white p-5 rounded-lg border border-[#DCD9D3] flex items-center justify-between">
            <div>
              <p className="font-serif text-lg">{a.cliente_nome}</p>
              <p className="text-sm text-[#6B6B6B]">{a.data} às {a.hora.slice(0,5)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] uppercase font-bold px-3 py-1 rounded-full ${a.status === 'confirmado' ? 'bg-[#2F8F6F]/10 text-[#2F8F6F]' : 'bg-gray-100 text-gray-500'}`}>{a.status}</span>
              <a href={`https://wa.me/${a.cliente_whatsapp.replace(/\D/g,"")}`} className="text-[#2F8F6F] hover:opacity-70"><MessageCircle size={20} /></a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}