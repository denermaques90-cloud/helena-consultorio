import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Calendar, Ban, Settings, Briefcase, Trash2, Plus, MessageCircle, Lock, Home } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Painel Profissional — Dra. Helena Martins" }] }),
  component: AdminPage,
});

type Servico = { id: string; nome: string; tempo_minutos: number; preco: number | null; ativo: boolean };
type Agendamento = { id: string; cliente_nome: string; cliente_whatsapp: string; data: string; hora: string; servico_ids: string[]; status: string; profissional_id: string; profissional_nome: string };
type Bloqueio = { id: string; data: string; hora: string | null; profissional_id: string };
type Profissional = { id: string; nome: string; especialidade: string; role: string; senha?: string; ativo: boolean };
type Config = { id: string; hora_abre: string; hora_fecha: string; intervalo_min: number; senha_admin: string; whatsapp_contato: string | null; instagram: string | null };

function fmtDateBR(iso: string) { const [y,m,d] = iso.split("-"); return `${d}/${m}/${y}`; }

function AdminPage() {
  const [logged, setLogged] = useState(false);
  const [user, setUser] = useState<Profissional | null>(null);
  const [pass, setPass] = useState("");
  const [config, setConfig] = useState<Config | null>(null);
  const [tab, setTab] = useState<"agenda" | "bloqueios" | "servicos" | "profissionais" | "config">("agenda");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = sessionStorage.getItem("admin_auth");
      if (auth) {
        try {
          const u = JSON.parse(auth);
          setUser(u);
          setLogged(true);
        } catch (e) {
          sessionStorage.removeItem("admin_auth");
        }
      }
    }
    supabase.from("config").select("*").limit(1).maybeSingle().then(({ data }) => data && setConfig(data as Config));
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const { data: prof, error } = await supabase
      .from("profissionais")
      .select("*")
      .eq("senha", pass)
      .maybeSingle();

    if (prof) {
      sessionStorage.setItem("admin_auth", JSON.stringify(prof));
      setLogged(true);
      toast.success(`Bem-vinda, ${prof.nome}`);
    } else {
      toast.error("Senha incorreta");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("admin_auth");
    setLogged(false);
    setUser(null);
    setPass("");
  }

  if (!logged) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <form onSubmit={handleLogin} className="premium-card p-8 w-full max-w-sm">
          <div className="text-center mb-6">
            <Lock className="text-gold mx-auto" size={28} />
            <h1 className="mt-3 font-serif text-2xl text-foreground">Painel Profissional</h1>
            <p className="text-xs text-muted-foreground mt-1">Acesso Restrito</p>
          </div>
          <input
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            placeholder="Senha de Acesso"
            className="w-full bg-input border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-gold"
          />
          <button className="mt-4 w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground">
            Entrar
          </button>
          <Link to="/" className="mt-4 block text-center text-xs text-muted-foreground hover:text-gold">Voltar ao site</Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-lg text-foreground">Painel Profissional</h1>
            <p className="text-xs text-gold tracking-wider">{user?.nome}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="p-2 text-muted-foreground hover:text-gold" title="Site"><Home size={18} /></Link>
            <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-gold" title="Sair"><LogOut size={18} /></button>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-5 flex gap-1 overflow-x-auto">
          {[
            { id: "agenda", label: "Agenda", icon: Calendar },
            { id: "bloqueios", label: "Bloqueios", icon: Ban },
            { id: "servicos", label: "Modalidades", icon: Briefcase },
            { id: "config", label: "Configurações", icon: Settings },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition whitespace-nowrap ${
                tab === t.id ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        {tab === "agenda" && <AgendaTab />}
        {tab === "bloqueios" && <BloqueiosTab />}
        {tab === "servicos" && <ServicosTab />}
        {tab === "config" && <ConfigTab config={config} onUpdate={setConfig} />}
      </main>
    </div>
  );
}

function AgendaTab() {
  const [items, setItems] = useState<Agendamento[]>([]);
  const [servicos, setServicos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data: ags }, { data: svc }] = await Promise.all([
      supabase.from("agendamentos").select("*").order("data", { ascending: true }).order("hora", { ascending: true }),
      supabase.from("servicos").select("id, nome"),
    ]);
    if (ags) setItems(ags as Agendamento[]);
    if (svc) setServicos(Object.fromEntries((svc as any[]).map(s => [s.id, s.nome])));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("agendamentos").update({ status }).eq("id", id);
    if (error) return toast.error("Erro ao atualizar");
    toast.success("Atualizado");
    load();
  }
  async function remove(id: string) {
    if (!confirm("Remover este agendamento?")) return;
    await supabase.from("agendamentos").delete().eq("id", id);
    toast.success("Removido");
    load();
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = items.filter(i => i.data >= today);
  const past = items.filter(i => i.data < today);

  return (
    <div>
      <h2 className="font-serif text-2xl text-foreground mb-1">Agendamentos</h2>
      <p className="text-sm text-muted-foreground mb-6">Solicitações de pacientes</p>
      {loading ? <p className="text-muted-foreground">Carregando...</p> : (
        <>
          <Section title="Próximos" items={upcoming} servicos={servicos} setStatus={setStatus} remove={remove} />
          <Section title="Histórico" items={past} servicos={servicos} setStatus={setStatus} remove={remove} muted />
        </>
      )}
    </div>
  );
}

function Section({ title, items, servicos, setStatus, remove, muted }: any) {
  if (items.length === 0) return (
    <div className="mb-8">
      <h3 className="text-xs uppercase tracking-wider text-gold mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground">Nenhum agendamento.</p>
    </div>
  );
  return (
    <div className="mb-8">
      <h3 className="text-xs uppercase tracking-wider text-gold mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((a: Agendamento) => (
          <div key={a.id} className={`premium-card p-4 ${muted ? "opacity-70" : ""}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-medium text-foreground">{a.cliente_nome}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    a.status === "confirmado" ? "bg-gold/20 text-gold" :
                    a.status === "cancelado" ? "bg-destructive/20 text-destructive" :
                    "bg-accent text-accent-foreground"
                  }`}>{a.status}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {fmtDateBR(a.data)} às {a.hora.slice(0,5)} · {(a.servico_ids || []).map(id => servicos[id]).filter(Boolean).join(", ") || "—"}
                </div>
                <a href={`https://wa.me/${a.cliente_whatsapp.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                   className="text-xs text-gold hover:underline inline-flex items-center gap-1 mt-1">
                  <MessageCircle size={12} /> {a.cliente_whatsapp}
                </a>
              </div>
              <div className="flex gap-2 flex-wrap">
                {a.status !== "concluido" && (
                  <button onClick={() => setStatus(a.id, "concluido")} className="text-xs px-3 py-1.5 rounded border border-border hover:border-gold">Concluir</button>
                )}
                {a.status !== "cancelado" && (
                  <button onClick={() => setStatus(a.id, "cancelado")} className="text-xs px-3 py-1.5 rounded border border-border hover:border-destructive">Cancelar</button>
                )}
                <button onClick={() => remove(a.id)} className="text-xs px-2 py-1.5 rounded border border-border hover:border-destructive text-destructive">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BloqueiosTab() {
  const [items, setItems] = useState<Bloqueio[]>([]);
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [diaInteiro, setDiaInteiro] = useState(false);

  async function load() {
    const { data: rows } = await supabase.from("horarios_bloqueados").select("*").order("data");
    if (rows) setItems(rows as Bloqueio[]);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    if (!diaInteiro && !hora) return toast.error("Informe o horário ou marque dia inteiro");
    const { error } = await supabase.from("horarios_bloqueados").insert({
      data, hora: diaInteiro ? null : hora,
    });
    if (error) return toast.error("Erro");
    toast.success("Bloqueio adicionado");
    setData(""); setHora(""); setDiaInteiro(false);
    load();
  }
  async function remove(id: string) {
    await supabase.from("horarios_bloqueados").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <h2 className="font-serif text-2xl text-foreground mb-1">Bloqueios de agenda</h2>
      <p className="text-sm text-muted-foreground mb-6">Bloqueie horários ou dias inteiros.</p>
      <form onSubmit={add} className="premium-card p-5 mb-6 grid gap-4 md:grid-cols-4">
        <div>
          <label className="text-xs text-gold uppercase tracking-wider">Data</label>
          <input type="date" value={data} onChange={e => setData(e.target.value)} className="mt-1 w-full bg-input border border-border rounded-md px-3 py-2 text-foreground" />
        </div>
        <div>
          <label className="text-xs text-gold uppercase tracking-wider">Horário</label>
          <input type="time" value={hora} disabled={diaInteiro} onChange={e => setHora(e.target.value)} className="mt-1 w-full bg-input border border-border rounded-md px-3 py-2 text-foreground disabled:opacity-40" />
        </div>
        <label className="flex items-end gap-2 text-sm text-foreground pb-2">
          <input type="checkbox" checked={diaInteiro} onChange={e => setDiaInteiro(e.target.checked)} className="accent-[var(--gold)]" />
          Dia inteiro
        </label>
        <button className="rounded-md bg-primary py-2 text-sm text-primary-foreground self-end inline-flex items-center justify-center gap-2"><Plus size={14}/> Adicionar</button>
      </form>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum bloqueio cadastrado.</p>}
        {items.map(b => (
          <div key={b.id} className="premium-card p-4 flex items-center justify-between">
            <div className="text-sm text-foreground">
              {fmtDateBR(b.data)} {b.hora ? `· ${b.hora.slice(0,5)}` : <span className="text-gold">· dia inteiro</span>}
            </div>
            <button onClick={() => remove(b.id)} className="text-destructive hover:text-destructive/70"><Trash2 size={14}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ServicosTab() {
  const [items, setItems] = useState<Servico[]>([]);
  const [nome, setNome] = useState("");
  const [tempo, setTempo] = useState(50);
  const [preco, setPreco] = useState<number | "">("");

  async function load() {
    const { data } = await supabase.from("servicos").select("*").order("nome");
    if (data) setItems(data as Servico[]);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!nome) return;
    await supabase.from("servicos").insert({ nome, tempo_minutos: tempo, preco: preco === "" ? 0 : preco });
    setNome(""); setTempo(50); setPreco("");
    load();
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
    <div>
      <h2 className="font-serif text-2xl text-foreground mb-1">Modalidades</h2>
      <p className="text-sm text-muted-foreground mb-6">Edite os tipos de atendimento oferecidos.</p>
      <form onSubmit={add} className="premium-card p-5 mb-6 grid gap-4 md:grid-cols-4">
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da modalidade" className="md:col-span-2 bg-input border border-border rounded-md px-3 py-2 text-foreground" />
        <input type="number" value={tempo} onChange={e => setTempo(+e.target.value)} placeholder="Minutos" className="bg-input border border-border rounded-md px-3 py-2 text-foreground" />
        <input type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value === "" ? "" : +e.target.value)} placeholder="Preço (interno)" className="bg-input border border-border rounded-md px-3 py-2 text-foreground" />
        <button className="md:col-span-4 rounded-md bg-primary py-2 text-sm text-primary-foreground inline-flex items-center justify-center gap-2"><Plus size={14}/> Adicionar modalidade</button>
      </form>
      <div className="space-y-2">
        {items.map(s => (
          <div key={s.id} className="premium-card p-4 flex items-center justify-between">
            <div>
              <div className="text-foreground font-medium">{s.nome}</div>
              <div className="text-xs text-muted-foreground">{s.tempo_minutos} min · R$ {Number(s.preco || 0).toFixed(2)}</div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={s.ativo} onChange={() => toggle(s)} className="accent-[var(--gold)]" />
                Ativo
              </label>
              <button onClick={() => remove(s.id)} className="text-destructive hover:opacity-70"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConfigTab({ config, onUpdate }: { config: Config | null; onUpdate: (c: Config) => void }) {
  const [form, setForm] = useState<Config | null>(config);
  useEffect(() => { setForm(config); }, [config]);
  if (!form) return <p className="text-muted-foreground">Carregando...</p>;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const { error } = await supabase.from("config").update({
      hora_abre: form.hora_abre, hora_fecha: form.hora_fecha, intervalo_min: form.intervalo_min,
      senha_admin: form.senha_admin, whatsapp_contato: form.whatsapp_contato, instagram: form.instagram,
    }).eq("id", form.id);
    if (error) return toast.error("Erro ao salvar");
    toast.success("Configurações salvas");
    onUpdate(form);
  }

  return (
    <div>
      <h2 className="font-serif text-2xl text-foreground mb-1">Configurações</h2>
      <p className="text-sm text-muted-foreground mb-6">Agenda, contato e segurança.</p>
      <form onSubmit={save} className="premium-card p-6 grid gap-5 md:grid-cols-2 max-w-2xl">
        <Field label="Abre às"><input type="time" value={form.hora_abre.slice(0,5)} onChange={e => setForm({...form, hora_abre: e.target.value})} className="input"/></Field>
        <Field label="Fecha às"><input type="time" value={form.hora_fecha.slice(0,5)} onChange={e => setForm({...form, hora_fecha: e.target.value})} className="input"/></Field>
        <Field label="Intervalo entre sessões (min)"><input type="number" value={form.intervalo_min} onChange={e => setForm({...form, intervalo_min: +e.target.value})} className="input"/></Field>
        <Field label="WhatsApp de contato"><input value={form.whatsapp_contato || ""} onChange={e => setForm({...form, whatsapp_contato: e.target.value})} placeholder="5511999999999" className="input"/></Field>
        <Field label="Instagram"><input value={form.instagram || ""} onChange={e => setForm({...form, instagram: e.target.value})} placeholder="usuario" className="input"/></Field>
        <Field label="Senha admin"><input type="text" value={form.senha_admin} onChange={e => setForm({...form, senha_admin: e.target.value})} className="input"/></Field>
        <button className="md:col-span-2 rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground">Salvar</button>
      </form>
      <style>{`.input{margin-top:.25rem;width:100%;background:var(--input);border:1px solid var(--border);border-radius:.375rem;padding:.5rem .75rem;color:var(--foreground);outline:none;}`}</style>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-gold uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}
