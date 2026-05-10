import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Calendar, Clock, ChevronLeft, ChevronRight, MessageCircle, CheckCircle2, ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agendar")({
  head: () => ({ meta: [{ title: "Agendar consulta — Dra. Helena Martins" }] }),
  component: AgendarPage,
});

type Servico = { id: string; nome: string; tempo_minutos: number; preco: number; ativo: boolean };
type Profissional = { id: string; nome: string; especialidade: string; whatsapp: string; ativo: boolean };
type Config = { hora_abre: string; hora_fecha: string; intervalo_min: number; whatsapp_contato: string | null };

function pad(n: number) { return n.toString().padStart(2, "0"); }
function toTimeStr(mins: number) { return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`; }
function timeToMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function fmtDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function AgendarPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  
  const [selectedSvcs, setSelectedSvcs] = useState<string[]>([]);
  const [selectedProf, setSelectedProf] = useState<Profissional | null>(null);
  
  const [monthDate, setMonthDate] = useState<Date>(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  
  const [busyTimes, setBusyTimes] = useState<{ hora: string; duracao: number }[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<string[]>([]);
  const [blockedDay, setBlockedDay] = useState(false);
  
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ data: string; hora: string; nome: string; servicoNomes: string; profNome: string } | null>(null);

  // Load initial data
  useEffect(() => {
    (async () => {
      const [{ data: svc }, { data: prfs }, { data: cfg }] = await Promise.all([
        supabase.from("servicos").select("*").eq("ativo", true).order("nome"),
        supabase.from("profissionais").select("*").eq("ativo", true).order("nome"),
        supabase.from("config").select("*").limit(1).maybeSingle(),
      ]);
      if (svc) setServicos(svc as Servico[]);
      if (prfs) setProfissionais(prfs as Profissional[]);
      if (cfg) setConfig(cfg as Config);
    })();
  }, []);

  // Load busy + blocked when date + professional selected
  useEffect(() => {
    if (!selectedDate || !selectedProf) return;
    (async () => {
      const [{ data: ags }, { data: blk }] = await Promise.all([
        supabase.from("agendamentos")
          .select("hora, servico_ids")
          .eq("data", selectedDate)
          .eq("profissional_id", selectedProf.id)
          .neq("status", "cancelado"),
        supabase.from("horarios_bloqueados")
          .select("hora")
          .eq("data", selectedDate)
          .eq("profissional_id", selectedProf.id),
      ]);
      const svcMap = new Map(servicos.map(s => [s.id, s.tempo_minutos]));
      const busy = (ags || []).map((a: any) => {
        const dur = (a.servico_ids || []).reduce((acc: number, id: string) => acc + (svcMap.get(id) || 50), 0) || 50;
        return { hora: a.hora.slice(0, 5), duracao: dur };
      });
      setBusyTimes(busy);
      const blocks = (blk || []) as { hora: string | null }[];
      setBlockedDay(blocks.some(b => !b.hora));
      setBlockedTimes(blocks.filter(b => b.hora).map(b => b.hora!.slice(0, 5)));
      setSelectedTime("");
    })();
  }, [selectedDate, selectedProf, servicos]);

  const totalDuracao = useMemo(() => {
    return selectedSvcs.reduce((acc, id) => acc + (servicos.find(s => s.id === id)?.tempo_minutos || 0), 0);
  }, [selectedSvcs, servicos]);

  const slots = useMemo(() => {
    if (!config || !selectedDate || blockedDay) return [];
    const open = timeToMin(config.hora_abre);
    const close = timeToMin(config.hora_fecha);
    const step = config.intervalo_min || 50;
    const dur = totalDuracao || step;
    const now = new Date();
    const isToday = selectedDate === isoDate(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const out: { time: string; available: boolean }[] = [];
    for (let t = open; t + dur <= close; t += step) {
      const time = toTimeStr(t);
      let available = true;
      if (isToday && t <= nowMin) available = false;
      if (blockedTimes.includes(time)) available = false;
      // conflict with existing appt
      for (const b of busyTimes) {
        const bs = timeToMin(b.hora), be = bs + b.duracao;
        if (t < be && t + dur > bs) { available = false; break; }
      }
      out.push({ time, available });
    }
    return out;
  }, [config, selectedDate, totalDuracao, busyTimes, blockedTimes, blockedDay]);

  // Calendar grid
  const calDays = useMemo(() => {
    const first = new Date(monthDate);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const days: { date?: string; day?: number; disabled?: boolean }[] = [];
    for (let i = 0; i < startWeekday; i++) days.push({});
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(first.getFullYear(), first.getMonth(), d);
      const past = dt < today;
      const sunday = dt.getDay() === 0;
      days.push({ date: isoDate(dt), day: d, disabled: past || sunday });
    }
    return days;
  }, [monthDate]);

  function toggleSvc(id: string) {
    setSelectedSvcs(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSubmit() {
    if (!nome || !whatsapp || !selectedDate || !selectedTime || !selectedProf || selectedSvcs.length === 0) return;
    setSubmitting(true);
    
    const valor_total = selectedSvcs.reduce((acc, id) => {
      const svc = servicos.find(s => s.id === id);
      return acc + (svc?.preco || 0);
    }, 0);

    const { error } = await supabase.from("agendamentos").insert({
      cliente_nome: nome,
      cliente_whatsapp: whatsapp,
      data: selectedDate,
      hora: selectedTime,
      servico_ids: selectedSvcs,
      status: "confirmado",
      profissional_id: selectedProf.id,
      profissional_nome: selectedProf.nome,
      valor_total: valor_total,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível enviar. Tente novamente.");
      return;
    }
    const svcNomes = selectedSvcs.map(id => servicos.find(s => s.id === id)?.nome).filter(Boolean).join(", ");
    setConfirmed({ data: selectedDate, hora: selectedTime, nome, servicoNomes: svcNomes, profNome: selectedProf.nome });
    
    // open WhatsApp to specific professional
    const wa = selectedProf.whatsapp || config?.whatsapp_contato || "5511999999999";
    const msg = `Olá, ${selectedProf.nome}. Gostaria de confirmar minha solicitação de agendamento:\n\nNome: ${nome}\nModalidade: ${svcNomes}\nData: ${fmtDateBR(selectedDate)}\nHorário: ${selectedTime}\n\nAguardo confirmação.`;
    setTimeout(() => {
      window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`, "_blank");
    }, 600);
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background">
        <SiteNav />
        <div className="pt-32 pb-20 px-5">
          <div className="mx-auto max-w-xl premium-card p-10 text-center">
            <CheckCircle2 className="text-gold mx-auto" size={48} />
            <h1 className="mt-5 font-serif text-3xl text-foreground">Solicitação enviada</h1>
            <p className="mt-3 text-muted-foreground">
              Sua solicitação para <strong>{confirmed.profNome}</strong> foi registrada.
            </p>
            <div className="mt-6 text-left bg-background/40 rounded-md p-5 text-sm space-y-2 border border-border/50">
              <div><span className="text-gold uppercase text-[10px] tracking-widest block mb-0.5">Nome</span> {confirmed.nome}</div>
              <div><span className="text-gold uppercase text-[10px] tracking-widest block mb-0.5">Profissional</span> {confirmed.profNome}</div>
              <div><span className="text-gold uppercase text-[10px] tracking-widest block mb-0.5">Modalidade</span> {confirmed.servicoNomes}</div>
              <div className="flex gap-4">
                <div><span className="text-gold uppercase text-[10px] tracking-widest block mb-0.5">Data</span> {fmtDateBR(confirmed.data)}</div>
                <div><span className="text-gold uppercase text-[10px] tracking-widest block mb-0.5">Horário</span> {confirmed.hora}</div>
              </div>
            </div>
            <Link to="/" className="mt-8 inline-flex items-center gap-2 text-sm text-gold hover:underline">
              <ArrowLeft size={14} /> Voltar ao início
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const monthLabel = monthDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="pt-32 pb-20 px-5">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-gold">Agendamento online</p>
            <h1 className="mt-3 font-serif text-3xl md:text-4xl text-foreground">Reserve seu horário</h1>
            <div className="gold-rule w-24 mt-4 mx-auto" />
          </div>

          {/* Steps */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} className={`h-1.5 w-12 rounded-full ${step >= n ? "bg-gold" : "bg-border"}`} />
            ))}
          </div>

          {/* Step 1: services */}
          {step === 1 && (
            <div className="premium-card p-8 animate-in fade-in duration-500">
              <h2 className="font-serif text-2xl text-foreground mb-1">1. Escolha a modalidade</h2>
              <p className="text-sm text-muted-foreground mb-6">Selecione o tipo de atendimento desejado.</p>
              <div className="space-y-3">
                {servicos.length === 0 && <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gold" /></div>}
                {servicos.map(s => {
                  const active = selectedSvcs.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSvc(s.id)}
                      className={`w-full text-left flex items-center justify-between p-4 rounded-md border transition-all duration-300 ${
                        active ? "border-gold bg-gold/10 shadow-[0_0_15px_rgba(197,165,114,0.1)]" : "border-border hover:border-gold/40"
                      }`}
                    >
                      <div>
                        <div className="text-foreground font-medium">{s.nome}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{s.tempo_minutos} minutos de sessão</div>
                      </div>
                      <div className={`h-6 w-6 rounded-full border flex items-center justify-center ${active ? "border-gold bg-gold text-primary-foreground" : "border-border"}`}>
                        {active && <CheckCircle2 size={14} />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <button
                disabled={selectedSvcs.length === 0}
                onClick={() => setStep(2)}
                className="mt-8 w-full rounded-md bg-primary py-4 text-sm font-bold text-primary-foreground disabled:opacity-30 hover:bg-primary/90 transition-all shadow-lg"
              >
                Próximo Passo
              </button>
            </div>
          )}

          {/* Step 2: professional */}
          {step === 2 && (
            <div className="premium-card p-8 animate-in fade-in duration-500">
              <h2 className="font-serif text-2xl text-foreground mb-1">2. Escolha o profissional</h2>
              <p className="text-sm text-muted-foreground mb-6">Com quem você deseja realizar o atendimento?</p>
              <div className="grid gap-3">
                {profissionais.map(p => {
                  const active = selectedProf?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProf(p)}
                      className={`w-full text-left flex items-center gap-4 p-4 rounded-md border transition-all duration-300 ${
                        active ? "border-gold bg-gold/10 shadow-[0_0_15px_rgba(197,165,114,0.1)]" : "border-border hover:border-gold/40"
                      }`}
                    >
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center border transition-colors ${active ? "bg-gold text-primary-foreground border-gold" : "bg-muted text-gold border-border"}`}>
                        <User size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="text-foreground font-medium">{p.nome}</div>
                        <div className="text-xs text-gold uppercase tracking-wider">{p.especialidade}</div>
                      </div>
                      <div className={`h-5 w-5 rounded-full border ${active ? "border-gold bg-gold" : "border-border"}`} />
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 rounded-md border border-border py-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Voltar</button>
                <button disabled={!selectedProf} onClick={() => setStep(3)} className="flex-2 w-full rounded-md bg-primary py-4 text-sm font-bold text-primary-foreground disabled:opacity-30 hover:bg-primary/90 transition-all shadow-lg">
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: date */}
          {step === 3 && (
            <div className="premium-card p-8 animate-in fade-in duration-500">
              <h2 className="font-serif text-2xl text-foreground mb-1">3. Escolha a data</h2>
              <p className="text-sm text-muted-foreground mb-6">Disponibilidade de {selectedProf?.nome}.</p>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => { const d = new Date(monthDate); d.setMonth(d.getMonth() - 1); setMonthDate(d); }}
                  className="p-2 hover:text-gold text-muted-foreground transition-colors"
                ><ChevronLeft size={20} /></button>
                <span className="font-serif text-xl capitalize text-foreground">{monthLabel}</span>
                <button
                  onClick={() => { const d = new Date(monthDate); d.setMonth(d.getMonth() + 1); setMonthDate(d); }}
                  className="p-2 hover:text-gold text-muted-foreground transition-colors"
                ><ChevronRight size={20} /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-gold mb-3">
                {["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"].map((d,i) => <div key={i} className="py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calDays.map((d, i) => (
                  <button
                    key={i}
                    disabled={!d.day || d.disabled}
                    onClick={() => d.date && setSelectedDate(d.date)}
                    className={`aspect-square rounded-md text-sm transition-all duration-300 flex items-center justify-center ${
                      !d.day ? "" :
                      d.disabled ? "text-muted-foreground/20 cursor-not-allowed" :
                      selectedDate === d.date ? "bg-gold text-primary-foreground font-bold shadow-md shadow-gold/20" :
                      "hover:bg-gold/10 text-foreground border border-transparent hover:border-gold/30"
                    }`}
                  >{d.day}</button>
                ))}
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 rounded-md border border-border py-4 text-sm font-medium text-muted-foreground">Voltar</button>
                <button disabled={!selectedDate} onClick={() => setStep(4)} className="flex-2 w-full rounded-md bg-primary py-4 text-sm font-bold text-primary-foreground disabled:opacity-30">
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 4: time */}
          {step === 4 && (
            <div className="premium-card p-8 animate-in fade-in duration-500">
              <h2 className="font-serif text-2xl text-foreground mb-1">4. Escolha o horário</h2>
              <div className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
                <Calendar size={14} className="text-gold" /> {fmtDateBR(selectedDate)} · <User size={14} className="text-gold ml-2" /> {selectedProf?.nome}
              </div>
              {blockedDay ? (
                <div className="py-12 text-center">
                   <p className="text-muted-foreground italic">Esta data foi bloqueada pelo profissional.</p>
                   <button onClick={() => setStep(3)} className="mt-4 text-gold text-sm underline">Escolher outro dia</button>
                </div>
              ) : slots.length === 0 ? (
                <div className="py-12 text-center">
                   <p className="text-muted-foreground italic">Sem horários disponíveis para este dia.</p>
                   <button onClick={() => setStep(3)} className="mt-4 text-gold text-sm underline">Escolher outro dia</button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {slots.map(s => (
                    <button
                      key={s.time}
                      disabled={!s.available}
                      onClick={() => setSelectedTime(s.time)}
                      className={`py-3 rounded-md text-sm font-medium transition-all border ${
                        !s.available ? "border-border/30 text-muted-foreground/30 cursor-not-allowed line-through" :
                        selectedTime === s.time ? "border-gold bg-gold text-primary-foreground shadow-md shadow-gold/10" :
                        "border-border text-foreground hover:border-gold/50 hover:bg-gold/5"
                      }`}
                    >{s.time}</button>
                  ))}
                </div>
              )}
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(3)} className="flex-1 rounded-md border border-border py-4 text-sm font-medium text-muted-foreground">Voltar</button>
                <button disabled={!selectedTime} onClick={() => setStep(5)} className="flex-2 w-full rounded-md bg-primary py-4 text-sm font-bold text-primary-foreground disabled:opacity-30">
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 5: contact */}
          {step === 5 && (
            <div className="premium-card p-8 animate-in fade-in duration-500">
              <h2 className="font-serif text-2xl text-foreground mb-6">5. Confirmação de Dados</h2>
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] text-gold uppercase tracking-[0.2em] block mb-1.5">Nome completo</label>
                  <input
                    value={nome} onChange={e => setNome(e.target.value)}
                    className="w-full bg-input border border-border rounded-md px-4 py-3.5 text-foreground outline-none focus:border-gold transition-colors"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gold uppercase tracking-[0.2em] block mb-1.5">WhatsApp (com DDD)</label>
                  <input
                    value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-input border border-border rounded-md px-4 py-3.5 text-foreground outline-none focus:border-gold transition-colors"
                    placeholder="11999999999"
                  />
                </div>
                <div className="bg-card/50 border border-border/50 rounded-lg p-5 space-y-3 mt-8">
                  <div className="text-gold text-[10px] uppercase tracking-[0.2em] font-bold mb-2">Resumo do Agendamento</div>
                  <div className="flex items-center gap-3 text-sm">
                    <User size={16} className="text-gold" />
                    <span className="text-foreground">{selectedProf?.nome}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar size={16} className="text-gold" />
                    <span className="text-foreground">{fmtDateBR(selectedDate)} às {selectedTime}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 size={16} className="text-gold" />
                    <span className="text-foreground">{selectedSvcs.map(id => servicos.find(s => s.id === id)?.nome).join(", ")}</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={() => setStep(4)} className="flex-1 rounded-md border border-border py-4 text-sm font-medium text-muted-foreground">Voltar</button>
                <button
                  disabled={submitting || !nome || whatsapp.length < 10}
                  onClick={handleSubmit}
                  className="flex-2 w-full rounded-md bg-gold py-4 text-sm font-bold text-primary-foreground disabled:opacity-30 hover:bg-gold/90 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
                  {submitting ? "Enviando..." : "Confirmar e Enviar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function Loader2({ className, size }: { className?: string, size?: number }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
}
