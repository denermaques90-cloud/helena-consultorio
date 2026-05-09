import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Calendar, Ban, Settings, Trash2, Plus, MessageCircle, Home, User, Loader2 } from "lucide-react";

export const Route = createFileRoute("/painel-profissional")({
  head: () => ({ meta: [{ title: "Meu Painel — Dra. Helena Martins" }] }),
  component: PainelProfissionalPage,
});

type Agendamento = { id: string; cliente_nome: string; cliente_whatsapp: string; data: string; hora: string; servico_ids: string[]; status: string; profissional_nome: string };
type Bloqueio = { id: string; data: string; hora: string | null };
type Profissional = { id: string; nome: string; especialidade: string; whatsapp: string; senha: string };

function fmtDateBR(iso: string) { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; }

function PainelProfissionalPage() {
  const [prof, setProf] = useState<Profissional | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"agenda" | "bloqueios" | "config">("agenda");
  const navigate = useNavigate();

  useEffect(() => {
    const id = sessionStorage.getItem("profissional_id");
    if (!id) {
      navigate({ to: "/profissional" });
      return;
    }

    supabase.from("profissionais").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      if (!data) {
        sessionStorage.clear();
        navigate({ to: "/profissional" });
        return;
      }
      setProf(data as Profissional);
      setLoading(false);
    });
  }, [navigate]);

  function handleLogout() {
    sessionStorage.clear();
    navigate({ to: "/entrada" });
  }

  if (loading || !prof) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={32} className="text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gold/10 rounded-full flex items-center justify-center text-gold">
              <User size={20} />
            </div>
            <div>
              <h1 className="font-serif text-lg text-foreground leading-none">{prof.nome}</h1>
              <p className="text-[10px] text-gold uppercase tracking-[0.2em] mt-1">{prof.especialidade}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="p-2 text-muted-foreground hover:text-gold transition-colors" title="Ver Site"><Home size={20} /></Link>
            <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Sair"><LogOut size={20} /></button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-5 flex gap-1 overflow-x-auto">
          {[
            { id: "agenda", label: "Minha Agenda", icon: Calendar },
            { id: "bloqueios", label: "Meus Bloqueios", icon: Ban },
            { id: "config", label: "Meus Dados", icon: Settings },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                tab === t.id ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {tab === "agenda" && <AgendaTab profissionalId={prof.id} />}
        {tab === "bloqueios" && <BloqueiosTab profissionalId={prof.id} profissionalNome={prof.nome} />}
        {tab === "config" && <ConfigTab prof={prof} onUpdate={setProf} />}
      </main>
    </div>
  );
}

function AgendaTab({ profissionalId }: { profissionalId: string }) {
  const [items, setItems] = useState<Agendamento[]>([]);
  const [servicos, setServicos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data: ags }, { data: svc }] = await Promise.all([
      supabase.from("agendamentos").select("*").eq("profissional_id", profissionalId).order("data", { ascending: true }).order("hora", { ascending: true }),
      supabase.from("servicos").select("id, nome"),
    ]);
    if (ags) setItems(ags as Agendamento[]);
    if (svc) setServicos(Object.fromEntries((svc as any[]).map(s => [s.id, s.nome])));
    setLoading(false);
  }
  useEffect(() => { load(); }, [profissionalId]);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("agendamentos").update({ status }).eq("id", id);
    if (error) return toast.error("Erro ao atualizar");
    toast.success("Status atualizado");
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remover este agendamento?")) return;
    await supabase.from("agendamentos").delete().eq("id", id);
    toast.success("Agendamento removido");
    load();
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = items.filter(i => i.data >= today);
  const past = items.filter(i => i.data < today);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="font-serif text-2xl text-foreground">Agendamentos</h2>
        <p className="text-sm text-muted-foreground mt-1">Gerencie suas consultas marcadas.</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="text-gold animate-spin" /></div>
      ) : (
        <>
          <Section title="Próximas Consultas" items={upcoming} servicos={servicos} setStatus={setStatus} remove={remove} />
          <Section title="Histórico de Atendimentos" items={past} servicos={servicos} setStatus={setStatus} remove={remove} muted />
        </>
      )}
    </div>
  );
}

function Section({ title, items, servicos, setStatus, remove, muted }: any) {
  if (items.length === 0) return (
    <div className="mb-10">
      <h3 className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-4 opacity-70">{title}</h3>
      <div className="premium-card p-8 text-center text-muted-foreground text-sm italic">Nenhum agendamento encontrado nesta seção.</div>
    </div>
  );
  return (
    <div className="mb-10">
      <h3 className="text-xs uppercase tracking-[0.2em] text-gold font-semibold mb-4 opacity-70">{title}</h3>
      <div className="grid gap-3">
        {items.map((a: Agendamento) => (
          <div key={a.id} className={`premium-card p-5 ${muted ? "opacity-60 grayscale-[0.5]" : ""}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-serif text-lg text-foreground">{a.cliente_nome}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-bold ${
                    a.status === "confirmado" ? "bg-gold/20 text-gold" :
                    a.status === "cancelado" ? "bg-destructive/20 text-destructive" :
                    "bg-accent text-accent-foreground"
                  }`}>{a.status}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-1.5"><Calendar size={14} className="text-gold" /> {fmtDateBR(a.data)} às {a.hora.slice(0,5)}</div>
                  <div className="h-1 w-1 bg-border rounded-full" />
                  <div>{(a.servico_ids || []).map(id => servicos[id]).filter(Boolean).join(", ") || "Consulta"}</div>
                </div>
                <div className="mt-3 flex items-center gap-3">
                   <a href={`https://wa.me/${a.cliente_whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                     className="text-xs bg-gold/10 text-gold px-3 py-1.5 rounded-md hover:bg-gold hover:text-primary-foreground transition-all inline-flex items-center gap-2">
                    <MessageCircle size={14} /> Conversar no WhatsApp
                  </a>
                  <span className="text-xs text-muted-foreground opacity-60">{a.cliente_whatsapp}</span>
                </div>
              </div>
              <div className="flex gap-2 border-t border-border/50 md:border-0 pt-3 md:pt-0">
                {a.status !== "concluido" && (
                  <button onClick={() => setStatus(a.id, "concluido")} className="flex-1 md:flex-none text-xs px-4 py-2 rounded-md border border-border hover:border-gold hover:text-gold transition-colors">Concluir</button>
                )}
                {a.status !== "cancelado" && (
                  <button onClick={() => setStatus(a.id, "cancelado")} className="flex-1 md:flex-none text-xs px-4 py-2 rounded-md border border-border hover:border-destructive hover:text-destructive transition-colors">Cancelar</button>
                )}
                <button onClick={() => remove(a.id)} className="p-2 rounded-md border border-border hover:bg-destructive hover:text-white transition-all text-destructive">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BloqueiosTab({ profissionalId, profissionalNome }: { profissionalId: string, profissionalNome: string }) {
  const [items, setItems] = useState<Bloqueio[]>([]);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [diaInteiro, setDiaInteiro] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data: rows } = await supabase.from("horarios_bloqueados").select("*").eq("profissional_id", profissionalId).order("data");
    if (rows) setItems(rows as Bloqueio[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, [profissionalId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return toast.error("Selecione uma data");
    if (!diaInteiro && !hora) return toast.error("Informe o horário ou marque dia inteiro");
    
    const { error } = await supabase.from("horarios_bloqueados").insert({
      data, 
      hora: diaInteiro ? null : hora,
      profissional_id: profissionalId,
      profissional_nome: profissionalNome
    });
    
    if (error) return toast.error("Erro ao adicionar bloqueio");
    toast.success("Bloqueio adicionado com sucesso");
    setData(""); setHora(""); setDiaInteiro(false);
    load();
  }
  
  async function remove(id: string) {
    const { error } = await supabase.from("horarios_bloqueados").delete().eq("id", id);
    if (error) return toast.error("Erro ao remover");
    toast.success("Bloqueio removido");
    load();
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="font-serif text-2xl text-foreground">Bloqueios de Agenda</h2>
        <p className="text-sm text-muted-foreground mt-1">Evite agendamentos em horários específicos ou datas comemorativas.</p>
      </div>

      <form onSubmit={add} className="premium-card p-6 mb-8">
        <div className="grid gap-5 md:grid-cols-4 items-end">
          <div className="md:col-span-1">
            <label className="text-xs text-gold uppercase tracking-wider block mb-1.5">Data do bloqueio</label>
            <input type="date" value={data} onChange={e => setData(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-foreground outline-none focus:border-gold transition-colors" />
          </div>
          <div className="md:col-span-1">
            <label className="text-xs text-gold uppercase tracking-wider block mb-1.5">Horário (opcional)</label>
            <input type="time" value={hora} disabled={diaInteiro} onChange={e => setHora(e.target.value)} className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-foreground outline-none focus:border-gold transition-colors disabled:opacity-30" />
          </div>
          <div className="md:col-span-1 py-3 flex items-center">
            <label className="flex items-center gap-3 text-sm text-foreground cursor-pointer select-none">
              <input type="checkbox" checked={diaInteiro} onChange={e => setDiaInteiro(e.target.checked)} className="h-5 w-5 rounded border-border bg-input text-gold focus:ring-gold accent-gold" />
              <span>Bloquear dia inteiro</span>
            </label>
          </div>
          <button className="md:col-span-1 w-full rounded-md bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
            <Plus size={18}/> Adicionar Bloqueio
          </button>
        </div>
      </form>

      <div className="grid gap-3">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="text-gold animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="premium-card p-10 text-center text-muted-foreground italic">Você não possui bloqueios ativos.</div>
        ) : (
          items.map(b => (
            <div key={b.id} className="premium-card p-5 flex items-center justify-between group hover:border-gold/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
                  <Ban size={18} />
                </div>
                <div>
                  <div className="text-foreground font-medium">{fmtDateBR(b.data)}</div>
                  <div className="text-xs text-muted-foreground">
                    {b.hora ? `Horário específico: ${b.hora.slice(0,5)}` : <span className="text-gold font-medium">Bloqueio total do dia</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => remove(b.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors opacity-40 group-hover:opacity-100" title="Remover bloqueio">
                <Trash2 size={18}/></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ConfigTab({ prof, onUpdate }: { prof: Profissional; onUpdate: (p: Profissional) => void }) {
  const [form, setForm] = useState<Profissional>(prof);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profissionais").update({
      nome: form.nome,
      especialidade: form.especialidade,
      whatsapp: form.whatsapp,
      senha: form.senha
    }).eq("id", form.id);
    
    setSaving(false);
    if (error) return toast.error("Erro ao salvar dados");
    toast.success("Perfil atualizado com sucesso");
    onUpdate(form);
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="font-serif text-2xl text-foreground">Meus Dados</h2>
        <p className="text-sm text-muted-foreground mt-1">Mantenha suas informações de contato atualizadas.</p>
      </div>

      <form onSubmit={save} className="premium-card p-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="text-xs text-gold uppercase tracking-wider block mb-1.5">Nome Exibido</label>
              <input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="w-full bg-input border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-gold transition-colors" />
            </div>
            <div>
              <label className="text-xs text-gold uppercase tracking-wider block mb-1.5">Especialidade</label>
              <input value={form.especialidade} onChange={e => setForm({...form, especialidade: e.target.value})} className="w-full bg-input border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-gold transition-colors" />
            </div>
          </div>
          
          <div>
            <label className="text-xs text-gold uppercase tracking-wider block mb-1.5">WhatsApp (para receber agendamentos)</label>
            <input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} placeholder="5511999999999" className="w-full bg-input border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-gold transition-colors" />
            <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">Os clientes entrarão em contato através deste número.</p>
          </div>

          <div>
            <label className="text-xs text-gold uppercase tracking-wider block mb-1.5">Senha de Acesso ao Painel</label>
            <div className="relative">
               <input type="text" value={form.senha} onChange={e => setForm({...form, senha: e.target.value})} className="w-full bg-input border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-gold transition-colors" />
               <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30" size={16} />
            </div>
          </div>

          <div className="pt-4 border-t border-border/50">
            <button disabled={saving} className="w-full md:w-auto px-8 rounded-md bg-gold py-3.5 text-sm font-bold text-primary-foreground hover:bg-gold/90 transition-all flex items-center justify-center gap-2">
              {saving ? <Loader2 size={18} className="animate-spin" /> : "Salvar Alterações"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
