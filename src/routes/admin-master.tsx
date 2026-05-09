import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShieldAlert, Users, Briefcase, Calendar, Plus, Trash2, Edit2, Lock, Home, Loader2, Save, X, User, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/admin-master")({
  head: () => ({ meta: [{ title: "Admin Master — Clínica Dra. Helena Martins" }] }),
  component: AdminMasterPage,
});

type Profissional = { id: string; nome: string; especialidade: string; whatsapp: string; senha: string; ativo: boolean };
type Servico = { id: string; nome: string; tempo_minutos: number; preco: number | null; ativo: boolean };
type Agendamento = { id: string; cliente_nome: string; cliente_whatsapp: string; data: string; hora: string; servico_ids: string[]; status: string; profissional_id: string | null; profissional_nome: string | null };

function fmtDateBR(iso: string) { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; }

function AdminMasterPage() {
  const [logged, setLogged] = useState(false);
  const [pass, setPass] = useState("");
  const [tab, setTab] = useState<"profissionais" | "servicos" | "agendamentos">("profissionais");
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("master_auth") === "true") {
      setLogged(true);
    }
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pass === "admin123") {
      sessionStorage.setItem("master_auth", "true");
      setLogged(true);
      toast.success("Acesso Master concedido");
    } else {
      toast.error("Senha incorreta");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("master_auth");
    setLogged(false);
    setPass("");
  }

  if (!logged) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <form onSubmit={handleLogin} className="premium-card p-10 w-full max-w-sm text-center">
          <div className="h-16 w-16 bg-gold/10 rounded-full flex items-center justify-center text-gold mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h1 className="font-serif text-2xl text-foreground mb-2">Painel Master</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-8">Administração Geral da Clínica</p>
          
          <div className="space-y-4">
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="Senha Master"
              className="w-full bg-input border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-gold text-center transition-all"
            />
            <button className="w-full rounded-md bg-gold py-3 text-sm font-bold text-primary-foreground hover:bg-gold/90 transition-all">
              Acessar Sistema
            </button>
          </div>
          <Link to="/entrada" className="mt-6 block text-xs text-muted-foreground hover:text-gold transition-colors">Voltar</Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-8 w-8 bg-gold rounded flex items-center justify-center text-primary-foreground">
                <ShieldAlert size={18} />
             </div>
             <h1 className="font-serif text-xl text-foreground">Clínica Master</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="p-2 text-muted-foreground hover:text-gold transition-colors" title="Site"><Home size={20} /></Link>
            <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Sair"><Lock size={20} /></button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-5 flex gap-1 overflow-x-auto">
          {[
            { id: "profissionais", label: "Profissionais", icon: Users },
            { id: "servicos", label: "Serviços/Modalidades", icon: Briefcase },
            { id: "agendamentos", label: "Todos os Agendamentos", icon: Calendar },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
                tab === t.id ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10">
        {tab === "profissionais" && <ProfissionaisTab />}
        {tab === "servicos" && <ServicosTab />}
        {tab === "agendamentos" && <AgendamentosTab />}
      </main>
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
    let res;
    
    if (isNew) {
      res = await supabase.from("profissionais").insert(editing as any);
    } else {
      res = await supabase.from("profissionais").update(editing as any).eq("id", editing.id!);
    }
    
    if (res.error) return toast.error("Erro ao salvar");
    toast.success(isNew ? "Profissional cadastrado" : "Dados atualizados");
    setEditing(null);
    load();
  }

  async function toggleStatus(p: Profissional) {
    const { error } = await supabase.from("profissionais").update({ ativo: !p.ativo }).eq("id", p.id);
    if (error) return toast.error("Erro ao alterar status");
    load();
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-3xl text-foreground">Gestão de Profissionais</h2>
          <p className="text-sm text-muted-foreground mt-1">Gerencie a equipe da clínica.</p>
        </div>
        <button 
          onClick={() => setEditing({ nome: "", especialidade: "", whatsapp: "", senha: "admin", ativo: true })}
          className="bg-gold hover:bg-gold/90 text-primary-foreground px-6 py-2.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-gold/10"
        >
          <Plus size={18} /> Novo Profissional
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-5">
           <form onSubmit={saveProf} className="premium-card p-8 w-full max-w-lg animate-in zoom-in-95 duration-200">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-xl text-foreground">{editing.id ? "Editar Profissional" : "Novo Profissional"}</h3>
                <button type="button" onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
             </div>
             <div className="space-y-4">
                <div>
                   <label className="text-[10px] text-gold uppercase tracking-[0.2em] block mb-1">Nome</label>
                   <input required value={editing.nome} onChange={e => setEditing({...editing, nome: e.target.value})} className="w-full bg-input border border-border rounded p-3 text-sm outline-none focus:border-gold" />
                </div>
                <div>
                   <label className="text-[10px] text-gold uppercase tracking-[0.2em] block mb-1">Especialidade</label>
                   <input value={editing.especialidade} onChange={e => setEditing({...editing, especialidade: e.target.value})} className="w-full bg-input border border-border rounded p-3 text-sm outline-none focus:border-gold" />
                </div>
                <div>
                   <label className="text-[10px] text-gold uppercase tracking-[0.2em] block mb-1">WhatsApp</label>
                   <input value={editing.whatsapp} onChange={e => setEditing({...editing, whatsapp: e.target.value})} className="w-full bg-input border border-border rounded p-3 text-sm outline-none focus:border-gold" />
                </div>
                <div>
                   <label className="text-[10px] text-gold uppercase tracking-[0.2em] block mb-1">Senha de Acesso</label>
                   <input required value={editing.senha} onChange={e => setEditing({...editing, senha: e.target.value})} className="w-full bg-input border border-border rounded p-3 text-sm outline-none focus:border-gold" />
                </div>
             </div>
             <div className="mt-8 flex gap-3">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 bg-accent text-accent-foreground py-3 rounded text-sm font-medium">Cancelar</button>
                <button className="flex-1 bg-gold text-primary-foreground py-3 rounded text-sm font-bold flex items-center justify-center gap-2"><Save size={16} /> Salvar Profissional</button>
             </div>
           </form>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? <div className="flex justify-center py-10"><Loader2 className="text-gold animate-spin" /></div> : 
          items.map(p => (
            <div key={p.id} className={`premium-card p-6 flex items-center justify-between group ${!p.ativo ? "opacity-50" : ""}`}>
               <div className="flex items-center gap-5">
                  <div className="h-14 w-14 bg-gold/5 rounded-full flex items-center justify-center text-gold border border-gold/10">
                     <User size={24} />
                  </div>
                  <div>
                     <h3 className="font-serif text-lg text-foreground leading-none">{p.nome}</h3>
                     <p className="text-xs text-gold mt-1.5">{p.especialidade}</p>
                     <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{p.whatsapp}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => toggleStatus(p)}
                    className={`text-xs px-4 py-1.5 rounded-full border transition-all ${
                      p.ativo ? "border-gold text-gold bg-gold/5" : "border-muted text-muted-foreground"
                    }`}
                  >
                    {p.ativo ? "Ativo" : "Inativo"}
                  </button>
                  <button onClick={() => setEditing(p)} className="p-2 text-muted-foreground hover:text-gold transition-colors"><Edit2 size={18} /></button>
               </div>
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
    const { error } = await supabase.from("servicos").insert(formData as any);
    if (error) return toast.error("Erro ao adicionar");
    setFormData({ nome: "", tempo_minutos: 50, preco: 0, ativo: true });
    load();
    toast.success("Modalidade adicionada");
  }

  async function toggle(s: Servico) {
    await supabase.from("servicos").update({ ativo: !s.ativo }).eq("id", s.id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta modalidade?")) return;
    await supabase.from("servicos").delete().eq("id", id);
    load();
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="font-serif text-3xl text-foreground">Modalidades de Atendimento</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure os tipos de sessões oferecidos pela clínica.</p>
      </div>

      <form onSubmit={add} className="premium-card p-6 mb-8 grid gap-4 md:grid-cols-4 items-end">
        <div className="md:col-span-1">
           <label className="text-[10px] text-gold uppercase tracking-wider block mb-1">Nome</label>
           <input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Psicoterapia Individual" className="w-full bg-input border border-border rounded p-3 text-sm outline-none focus:border-gold" />
        </div>
        <div className="md:col-span-1">
           <label className="text-[10px] text-gold uppercase tracking-wider block mb-1">Duração (min)</label>
           <input type="number" value={formData.tempo_minutos} onChange={e => setFormData({...formData, tempo_minutos: +e.target.value})} className="w-full bg-input border border-border rounded p-3 text-sm outline-none focus:border-gold" />
        </div>
        <div className="md:col-span-1">
           <label className="text-[10px] text-gold uppercase tracking-wider block mb-1">Valor Sugerido (R$)</label>
           <input type="number" step="0.01" value={formData.preco} onChange={e => setFormData({...formData, preco: +e.target.value})} className="w-full bg-input border border-border rounded p-3 text-sm outline-none focus:border-gold" />
        </div>
        <button className="bg-primary text-primary-foreground h-[46px] rounded font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all">
          <Plus size={18} /> Adicionar
        </button>
      </form>

      <div className="grid gap-3">
        {loading ? <div className="flex justify-center py-8"><Loader2 className="text-gold animate-spin" /></div> : 
          items.map(s => (
            <div key={s.id} className="premium-card p-5 flex items-center justify-between group">
               <div>
                  <h4 className="font-serif text-lg text-foreground">{s.nome}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{s.tempo_minutos} minutos · <span className="text-gold font-medium">R$ {Number(s.preco || 0).toFixed(2)}</span></p>
               </div>
               <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={s.ativo} onChange={() => toggle(s)} className="accent-gold h-4 w-4" />
                    <span>{s.ativo ? "Ativo" : "Inativo"}</span>
                  </label>
                  <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={16} /></button>
               </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

function AgendamentosTab() {
  const [items, setItems] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProf, setFilterProf] = useState("");
  const [profs, setProfs] = useState<{id: string, nome: string}[]>([]);

  async function load() {
    setLoading(true);
    const [{ data: ags }, { data: prfs }] = await Promise.all([
      supabase.from("agendamentos").select("*").order("data", { ascending: false }),
      supabase.from("profissionais").select("id, nome"),
    ]);
    if (ags) setItems(ags as Agendamento[]);
    if (prfs) setProfs(prfs);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = items.filter(i => !filterProf || i.profissional_id === filterProf);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-3xl text-foreground">Histórico Geral</h2>
          <p className="text-sm text-muted-foreground mt-1">Todos os agendamentos da clínica.</p>
        </div>
        <select 
          value={filterProf} 
          onChange={e => setFilterProf(e.target.value)}
          className="bg-input border border-border rounded px-4 py-2 text-sm outline-none focus:border-gold"
        >
          <option value="">Todos os Profissionais</option>
          {profs.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>

      <div className="grid gap-3">
        {loading ? <div className="flex justify-center py-10"><Loader2 className="text-gold animate-spin" /></div> : 
          filtered.map(a => (
            <div key={a.id} className="premium-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <div className="flex items-center gap-3">
                     <span className="font-serif text-lg text-foreground">{a.cliente_nome}</span>
                     <span className="text-[10px] uppercase bg-accent text-accent-foreground px-2 py-0.5 rounded">{a.status}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                     {fmtDateBR(a.data)} às {a.hora.slice(0,5)} · <span className="text-gold">{a.profissional_nome || "Sem profissional"}</span>
                  </div>
               </div>
               <div className="flex items-center gap-4">
                  <div className="text-right">
                     <p className="text-xs text-muted-foreground">WhatsApp Cliente</p>
                     <p className="text-sm font-medium">{a.cliente_whatsapp}</p>
                  </div>
                  <a href={`https://wa.me/${a.cliente_whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="p-2 bg-gold/10 text-gold rounded hover:bg-gold hover:text-primary-foreground transition-all">
                    <MessageCircle size={18} />
                  </a>
               </div>
            </div>
          ))
        }
        {!loading && filtered.length === 0 && <div className="premium-card p-10 text-center text-muted-foreground">Nenhum agendamento encontrado para este filtro.</div>}
      </div>
    </div>
  );
}
