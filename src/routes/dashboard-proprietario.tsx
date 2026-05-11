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
  head: () => ({ meta: [{ title: "Dashboard Proprietário - Dra. Helena Martins" }] }),
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
      <aside className="w-64 bg-white border-r border-[#DCD9D3] p-6 hidden md:flex flex-col h-screen sticky top-0">
        <h2 className="font-serif text-2xl text-[#2F8F6F] mb-10">Dra. Helena Martins</h2>
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
            <p className="text-[#6B6B6B]">Gestão administrativa da clínica</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-widest text-[#2F8F6F]">Proprietária</span>
          </div>
        </header>

        {tab === "dashboard" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard label="Faturamento Total" value={`R$ ${totalRevenue.toFixed(2)}`} icon={DollarSign} trend="+12%" />
              <MetricCard label="Agendamentos" value={agendamentos.length} icon={Calendar} trend="+5%" />
              <MetricCard label="Profissionais" value={profissionais.length} icon={Users} trend="Ativos" />
            </div>
            <div className="premium-card p-6 bg-white shadow-sm h-[400px]">
              <h3 className="font-serif text-xl mb-6">Faturamento por Profissional (Ranking)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={profissionais.map(p => ({
                    nome: p.nome.split(" ")[0],
                    faturamento: agendamentos.filter(a => a.profissional_id === p.id).reduce((acc, a) => acc + (a.valor_total || 0), 0)
                })).sort((a,b) => b.faturamento - a.faturamento)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#DCD9D3" />
                  <XAxis dataKey="nome" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #DCD9D3" }} />
                  <Bar dataKey="faturamento" fill="#2F8F6F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {tab === "profissionais" && (
          <div className="premium-card bg-white shadow-sm overflow-hidden animate-in fade-in duration-500">
            <div className="p-6 border-b border-[#DCD9D3]">
              <h3 className="font-serif text-xl">Gestão de Profissionais</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#F4F1EA] text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B]">
                  <tr>
                    <th className="p-4">Nome</th>
                    <th className="p-4">Especialidade</th>
                    <th className="p-4">WhatsApp</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCD9D3]">
                  {profissionais.map(p => (
                    <tr key={p.id} className="hover:bg-[#F7F5F0]/50 transition-colors">
                      <td className="p-4 font-medium">{p.nome}</td>
                      <td className="p-4 text-sm text-[#6B6B6B]">{p.especialidade}</td>
                      <td className="p-4 text-sm">{p.whatsapp}</td>
                      <td className="p-4">
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${p.ativo ? "bg-[#2F8F6F]/10 text-[#2F8F6F]" : "bg-gray-100 text-gray-400"}`}>
                          {p.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="p-4">
                        {p.role !== 'owner' && (
                          <button 
                            onClick={async () => {
                              if (confirm(`Excluir ${p.nome}?`)) {
                                const { error } = await supabase.from("profissionais").delete().eq("id", p.id);
                                if (error) toast.error("Erro ao excluir");
                                else {
                                  toast.success("Profissional removido");
                                  setProfissionais(profissionais.filter(x => x.id !== p.id));
                                }
                              }
                            }}
                            className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-widest"
                          >
                            Excluir
                          </button>
                        )}
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
            <div className="p-6 border-b border-[#DCD9D3]">
              <h3 className="font-serif text-xl">Todos os Agendamentos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#F4F1EA] text-[10px] uppercase tracking-widest font-bold text-[#6B6B6B]">
                  <tr>
                    <th className="p-4">Data/Hora</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Profissional</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCD9D3]">
                  {agendamentos.map(a => (
                    <tr key={a.id} className="hover:bg-[#F7F5F0]/50 transition-colors">
                      <td className="p-4 text-sm">{a.data} - {a.hora.slice(0, 5)}</td>
                      <td className="p-4 font-medium">{a.cliente_nome}</td>
                      <td className="p-4 text-sm text-[#6B6B6B]">{a.profissional_nome}</td>
                      <td className="p-4">
                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${a.status === 'confirmado' ? 'bg-[#2F8F6F]/10 text-[#2F8F6F]' : 'bg-gray-100 text-gray-400'}`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-4 font-medium">R$ {a.valor_total?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-lg border border-[#DCD9D3] shadow-sm hover:border-[#2F8F6F] transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="h-10 w-10 bg-[#2F8F6F]/10 rounded flex items-center justify-center text-[#2F8F6F]"><Icon size={20} /></div>
        <span className="text-xs font-bold text-[#2F8F6F] bg-[#2F8F6F]/10 px-2 py-1 rounded">{trend}</span>
      </div>
      <p className="text-sm text-[#6B6B6B] uppercase tracking-widest font-bold">{label}</p>
      <p className="text-3xl font-serif mt-1">{value}</p>
    </div>
  );
}