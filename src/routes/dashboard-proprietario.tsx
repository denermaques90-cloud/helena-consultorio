import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  LayoutDashboard, Users, Calendar, DollarSign, Briefcase, Settings, LogOut, 
  ChevronDown, Search, Menu, X, ArrowUpRight, ArrowDownRight, User, TrendingUp 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";

export const Route = createFileRoute("/dashboard-proprietario")({
  head: () => ({ meta: [{ title: "Dashboard Proprietário | Clínica Premium" }] }),
  component: DashboardProprietario,
});

type Agendamento = { id: string; cliente_nome: string; cliente_whatsapp: string; data: string; hora: string; servico_ids: string[]; status: string; profissional_id: string | null; profissional_nome: string | null; valor_total: number | null };
type Profissional = { id: string; nome: string; especialidade: string | null; whatsapp: string | null; senha: string; ativo: boolean; role: string | null };

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
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center p-5">
        <form onSubmit={handleLogin} className="premium-card p-10 w-full max-w-sm text-center bg-white shadow-xl">
          <h1 className="font-serif text-2xl text-[#2F8F6F] mb-6">Acesso Proprietário</h1>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Senha Master" className="w-full bg-[#F4F1EA] border border-[#DCD9D3] rounded p-3 text-center outline-none focus:border-[#2F8F6F]" />
          <button className="mt-4 w-full bg-[#2F8F6F] text-white py-3 rounded font-bold hover:bg-[#2F8F6F]/90">Acessar</button>
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
  
  useEffect(() => {
    Promise.all([
      supabase.from("agendamentos").select("*").in("status", ["confirmado", "concluido"]),
      supabase.from("profissionais").select("*")
    ]).then(([ags, prfs]) => {
      if (ags.data) setAgendamentos(ags.data);
      if (prfs.data) setProfissionais(prfs.data);
    });
  }, []);

  const totalRevenue = useMemo(() => agendamentos.reduce((acc, a) => acc + (a.valor_total || 0), 0), [agendamentos]);

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex">
      <aside className="w-64 bg-white border-r border-[#DCD9D3] p-6 hidden md:flex flex-col">
        <h2 className="font-serif text-2xl text-[#2F8F6F] mb-10">Clínica Premium</h2>
        <nav className="space-y-4 flex-1">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "profissionais", label: "Profissionais", icon: Users },
            { id: "agendamentos", label: "Agendamentos", icon: Calendar },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-3 w-full p-3 rounded font-medium ${tab === t.id ? "bg-[#2F8F6F]/10 text-[#2F8F6F]" : "text-[#6B6B6B] hover:text-[#2F8F6F]"}`}>
              <t.icon size={20} /> {t.label}
            </button>
          ))}
        </nav>
        <button onClick={() => {sessionStorage.clear(); window.location.reload();}} className="flex items-center gap-3 text-[#6B6B6B] hover:text-[#2F8F6F]"><LogOut size={20} /> Sair</button>
      </aside>
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-serif">Bem-vinda, Dra. Helena</h1>
            <p className="text-[#6B6B6B]">Seu painel de controle administrativo</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Hoje, 11 de Maio</span>
          </div>
        </header>

        {tab === "dashboard" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard label="Faturamento Total" value={`R$ ${totalRevenue.toFixed(2)}`} icon={DollarSign} trend="+12%" />
              <MetricCard label="Agendamentos" value={agendamentos.length} icon={Calendar} trend="+5%" />
              <MetricCard label="Profissionais Ativos" value={profissionais.length} icon={Users} trend="Estável" />
            </div>
            <div className="premium-card p-6 bg-white shadow-sm h-[400px]">
              <h3 className="font-serif text-xl mb-6">Faturamento por Profissional</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profissionais.map(p => ({
                    nome: p.nome.split(" ")[0],
                    faturamento: agendamentos.filter(a => a.profissional_id === p.id).reduce((acc, a) => acc + (a.valor_total || 0), 0)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip contentStyle={{ borderRadius: "8px" }} />
                  <Bar dataKey="faturamento" fill="#2F8F6F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-lg border border-[#DCD9D3] shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="h-10 w-10 bg-[#2F8F6F]/10 rounded flex items-center justify-center text-[#2F8F6F]"><Icon size={20} /></div>
        <span className="text-xs font-bold text-[#2F8F6F] bg-[#2F8F6F]/10 px-2 py-1 rounded">{trend}</span>
      </div>
      <p className="text-sm text-[#6B6B6B]">{label}</p>
      <p className="text-3xl font-serif mt-1">{value}</p>
    </div>
  );
}