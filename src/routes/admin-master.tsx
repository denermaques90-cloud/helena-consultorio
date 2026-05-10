import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldAlert, Users, Briefcase, Calendar, Plus, Trash2, Edit2, Lock, Home, Loader2, Save, X, User, MessageCircle, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin-master")({
  head: () => ({ meta: [{ title: "Dashboard Proprietário — Dra. Helena Martins" }] }),
  component: AdminMasterPage,
});

type Profissional = { id: string; nome: string; especialidade: string; whatsapp: string; senha: string; ativo: boolean; role: string };
type Servico = { id: string; nome: string; tempo_minutos: number; preco: number | null; ativo: boolean };
type Agendamento = { id: string; cliente_nome: string; cliente_whatsapp: string; data: string; hora: string; servico_ids: string[]; status: string; profissional_id: string | null; profissional_nome: string | null; valor_total: number | null };

function fmtDateBR(iso: string) { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; }

function AdminMasterPage() {
  const [logged, setLogged] = useState(false);
  const [pass, setPass] = useState("");
  const [tab, setTab] = useState<"dashboard" | "profissionais" | "servicos" | "agendamentos">("dashboard");
  
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
        <form onSubmit={handleLogin} className="premium-card p-10 w-full max-w-sm text-center">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
            <Lock size={32} />
          </div>
          <h1 className="font-serif text-2xl text-foreground">Dashboard Proprietário</h1>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Senha Master" className="mt-8 w-full bg-input border border-border rounded p-3 text-center outline-none focus:border-primary" />
          <button className="mt-4 w-full bg-primary text-primary-foreground py-3 rounded font-bold">Acessar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 bg-primary rounded flex items-center justify-center text-primary-foreground"><ShieldAlert size={18} /></div>
             <h1 className="font-serif text-xl text-foreground">Dashboard Master</h1>
          </div>
          <button onClick={() => {sessionStorage.clear(); window.location.reload();}} className="text-muted-foreground hover:text-destructive">Sair</button>
        </div>
        <nav className="mx-auto max-w-7xl px-5 flex gap-1 overflow-x-auto">
          {[
            { id: "dashboard", label: "Dashboard", icon: TrendingUp },
            { id: "profissionais", label: "Profissionais", icon: Users },
            { id: "servicos", label: "Serviços", icon: Briefcase },
            { id: "agendamentos", label: "Agendamentos", icon: Calendar },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)} className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-10">
        {tab === "dashboard" && <DashboardTab />}
        {tab === "profissionais" && <ProfissionaisTab />}
        {tab === "servicos" && <ServicosTab />}
        {tab === "agendamentos" && <AgendamentosTab />}
      </main>
    </div>
  );
}

function DashboardTab() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  useEffect(() => {
    supabase.from("agendamentos").select("*").in("status", ["confirmado", "concluido"]).then(({ data }) => data && setAgendamentos(data));
  }, []);

  const totalRevenue = useMemo(() => agendamentos.reduce((acc, a) => acc + (a.valor_total || 0), 0), [agendamentos]);
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="premium-card p-6 border-l-4 border-l-primary">
            <p className="text-muted-foreground uppercase text-[10px] tracking-widest">Faturamento Total</p>
            <p className="font-serif text-4xl mt-2">R$ {totalRevenue.toFixed(2)}</p>
         </div>
         <div className="premium-card p-6 border-l-4 border-l-primary">
            <p className="text-muted-foreground uppercase text-[10px] tracking-widest">Total Agendamentos</p>
            <p className="font-serif text-4xl mt-2">{agendamentos.length}</p>
         </div>
         <div className="premium-card p-6 border-l-4 border-l-primary">
            <p className="text-muted-foreground uppercase text-[10px] tracking-widest">Ticket Médio</p>
            <p className="font-serif text-4xl mt-2">R$ {(totalRevenue / (agendamentos.length || 1)).toFixed(2)}</p>
         </div>
      </div>
    </div>
  );
}

function ProfissionaisTab() {
  const [items, setItems] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Profissional> | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("profissionais").select("*").order("nome");
    if (data) setItems(data as Profissional[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function saveProf(e: React.FormEvent) {
    e.preventDefault();
    if (!editing?.nome || !editing?.senha) return toast.error("Nome e Senha são obrigatórios");
    const isNew = !editing.id;
    let res = isNew ? await supabase.from("profissionais").insert(editing as any) : await supabase.from("profissionais").update(editing as any).eq("id", editing.id!);
    if (res.error) return toast.error("Erro ao salvar");
    toast.success(isNew ? "Profissional cadastrado" : "Dados atualizados");
    setEditing(null);
    load();
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif text-3xl text-foreground">Gestão de Profissionais</h2>
        <button onClick={() => setEditing({ nome: "", especialidade: "", whatsapp: "", senha: "admin", ativo: true })} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-bold flex items-center gap-2"><Plus size={18} /> Novo Profissional</button>
      </div>
      <div className="grid gap-4">
        {loading ? <div className="flex justify-center py-10"><Loader2 className="text-primary animate-spin" /></div> : 
          items.map(p => (
            <div key={p.id} className="premium-card p-6 flex items-center justify-between">
               <div>
                  <h3 className="font-serif text-lg text-foreground">{p.nome}</h3>
                  <p className="text-xs text-primary mt-1">{p.especialidade}</p>
               </div>
               <button onClick={() => setEditing(p)} className="p-2 text-muted-foreground hover:text-primary"><Edit2 size={18} /></button>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function ServicosTab() {
  const [items, setItems] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<Servico>>({ nome: "", tempo_minutos: 50, preco: 0, ativo: true });

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("servicos").select("*").order("nome");
    if (data) setItems(data as Servico[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.nome) return;
    await supabase.from("servicos").insert(formData as any);
    setFormData({ nome: "", tempo_minutos: 50, preco: 0, ativo: true });
    load();
    toast.success("Modalidade adicionada");
  }

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="font-serif text-3xl text-foreground mb-8">Modalidades de Atendimento</h2>
      <form onSubmit={add} className="premium-card p-6 mb-8 grid gap-4 md:grid-cols-4 items-end">
        <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Nome" className="w-full bg-input border border-border rounded p-3 text-sm" />
        <input type="number" value={formData.tempo_minutos} onChange={e => setFormData({...formData, tempo_minutos: +e.target.value})} className="w-full bg-input border border-border rounded p-3 text-sm" />
        <input type="number" step="0.01" value={formData.preco ?? ""} onChange={e => setFormData({...formData, preco: +e.target.value})} className="w-full bg-input border border-border rounded p-3 text-sm" />
        <button className="bg-primary text-primary-foreground h-[46px] rounded font-bold text-sm flex items-center justify-center gap-2"><Plus size={18} /> Adicionar</button>
      </form>
      <div className="grid gap-3">
        {items.map(s => (
          <div key={s.id} className="premium-card p-5 flex items-center justify-between">
             <div>
                <h4 className="font-serif text-lg text-foreground">{s.nome}</h4>
                <p className="text-xs text-muted-foreground mt-1">{s.tempo_minutos} min · R$ {Number(s.preco || 0).toFixed(2)}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AgendamentosTab() {
  const [items, setItems] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("agendamentos").select("*").order("data", { ascending: false });
    if (data) setItems(data as Agendamento[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="font-serif text-3xl text-foreground mb-8">Histórico Geral</h2>
      <div className="grid gap-3">
        {loading ? <div className="flex justify-center py-10"><Loader2 className="text-primary animate-spin" /></div> : 
          items.map(a => (
            <div key={a.id} className="premium-card p-5 flex items-center justify-between">
               <div>
                  <span className="font-serif text-lg text-foreground">{a.cliente_nome}</span>
                  <div className="text-sm text-muted-foreground mt-1">{fmtDateBR(a.data)} às {a.hora.slice(0,5)} · {a.profissional_nome}</div>
               </div>
               <div className="text-sm font-bold text-primary">R$ {Number(a.valor_total || 0).toFixed(2)}</div>
            </div>
          ))
        }
      </div>
    </div>
  );
}
