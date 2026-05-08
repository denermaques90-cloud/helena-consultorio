import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Calendar, Clock, ChevronLeft, ChevronRight, MessageCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agendar")({
  head: () => ({ meta: [{ title: "Agendar consulta — Dra. Helena Martins" }] }),
  component: AgendarPage,
});

type Servico = { id: string; nome: string; tempo_minutos: number; ativo: boolean };
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
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [selectedSvcs, setSelectedSvcs] = useState<string[]>([]);
  const [monthDate, setMonthDate] = useState<Date>(() => { const d = new Date(); d.setDate(1); return d; });
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [busyTimes, setBusyTimes] = useState<{ hora: string; duracao: number }[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<string[]>([]);
  const [blockedDay, setBlockedDay] = useState(false);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<{ data: string; hora: string; nome: string; servicoNomes: string } | null>(null);

  // Load servicos + config
  useEffect(() => {
    (async () => {
      const [{ data: svc }, { data: cfg }] = await Promise.all([
        supabase.from("servicos").select("*").eq("ativo", true).order("nome"),
        supabase.from("config").select("*").limit(1).maybeSingle(),
      ]);
      if (svc) setServicos(svc as Servico[]);
      if (cfg) setConfig(cfg as Config);
    })();
  }, []);

  // Load busy + blocked when date selected
  useEffect(() => {
    if (!selectedDate) return;
    (async () => {
      const [{ data: ags }, { data: blk }] = await Promise.all([
        supabase.from("agendamentos").select("hora, servico_ids").eq("data", selectedDate).neq("status", "cancelado"),
        supabase.from("horarios_bloqueados").select("hora").eq("data", selectedDate),
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
  }, [selectedDate, servicos]);

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
    if (!nome || !whatsapp || !selectedDate || !selectedTime || selectedSvcs.length === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from("agendamentos").insert({
      cliente_nome: nome,
      cliente_whatsapp: whatsapp,
      data: selectedDate,
      hora: selectedTime,
      servico_ids: selectedSvcs,
      status: "confirmado",
    });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível enviar. Tente novamente.");
      return;
    }
    const svcNomes = selectedSvcs.map(id => servicos.find(s => s.id === id)?.nome).filter(Boolean).join(", ");
    setConfirmed({ data: selectedDate, hora: selectedTime, nome, servicoNomes: svcNomes });
    // open WhatsApp
    const wa = config?.whatsapp_contato || "5511999999999";
    const msg = `Olá, Dra. Helena Martins. Gostaria de confirmar minha solicitação de agendamento:\n\nNome: ${nome}\nServiço: ${svcNomes}\nData: ${fmtDateBR(selectedDate)}\nHorário: ${selectedTime}\n\nAguardo confirmação.`;
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
              Sua solicitação foi registrada. A confirmação será feita pelo WhatsApp.
            </p>
            <div className="mt-6 text-left bg-background/40 rounded-md p-5 text-sm space-y-2">
              <div><span className="text-gold">Nome:</span> {confirmed.nome}</div>
              <div><span className="text-gold">Modalidade:</span> {confirmed.servicoNomes}</div>
              <div><span className="text-gold">Data:</span> {fmtDateBR(confirmed.data)}</div>
              <div><span className="text-gold">Horário:</span> {confirmed.hora}</div>
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
            {[1, 2, 3, 4].map(n => (
              <div key={n} className={`h-1.5 w-12 rounded-full ${step >= n ? "bg-gold" : "bg-border"}`} />
            ))}
          </div>

          {/* Step 1: services */}
          {step === 1 && (
            <div className="premium-card p-7">
              <h2 className="font-serif text-xl text-foreground mb-1">1. Escolha a modalidade</h2>
              <p className="text-sm text-muted-foreground mb-5">Selecione um ou mais tipos de atendimento.</p>
              <div className="space-y-3">
                {servicos.length === 0 && <p className="text-sm text-muted-foreground">Carregando modalidades...</p>}
                {servicos.map(s => {
                  const active = selectedSvcs.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => toggleSvc(s.id)}
                      className={`w-full text-left flex items-center justify-between p-4 rounded-md border transition ${
                        active ? "border-gold bg-gold/5" : "border-border hover:border-gold/40"
                      }`}
                    >
                      <div>
                        <div className="text-foreground font-medium">{s.nome}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{s.tempo_minutos} minutos</div>
                      </div>
                      <div className={`h-5 w-5 rounded-full border ${active ? "border-gold bg-gold" : "border-border"}`} />
                    </button>
                  );
                })}
              </div>
              <button
                disabled={selectedSvcs.length === 0}
                onClick={() => setStep(2)}
                className="mt-6 w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Step 2: date */}
          {step === 2 && (
            <div className="premium-card p-7">
              <h2 className="font-serif text-xl text-foreground mb-1">2. Escolha a data</h2>
              <p className="text-sm text-muted-foreground mb-5">Domingos não disponíveis.</p>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => { const d = new Date(monthDate); d.setMonth(d.getMonth() - 1); setMonthDate(d); }}
                  className="p-2 hover:text-gold text-muted-foreground"
                ><ChevronLeft size={18} /></button>
                <span className="font-serif text-lg capitalize">{monthLabel}</span>
                <button
                  onClick={() => { const d = new Date(monthDate); d.setMonth(d.getMonth() + 1); setMonthDate(d); }}
                  className="p-2 hover:text-gold text-muted-foreground"
                ><ChevronRight size={18} /></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground mb-2">
                {["D","S","T","Q","Q","S","S"].map((d,i) => <div key={i} className="py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calDays.map((d, i) => (
                  <button
                    key={i}
                    disabled={!d.day || d.disabled}
                    onClick={() => d.date && setSelectedDate(d.date)}
                    className={`aspect-square rounded-md text-sm transition ${
                      !d.day ? "" :
                      d.disabled ? "text-muted-foreground/30 cursor-not-allowed" :
                      selectedDate === d.date ? "bg-gold text-primary-foreground font-medium" :
                      "hover:bg-gold/10 text-foreground"
                    }`}
                  >{d.day}</button>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={() => setStep(1)} className="flex-1 rounded-md border border-border py-3 text-sm text-muted-foreground">Voltar</button>
                <button disabled={!selectedDate} onClick={() => setStep(3)} className="flex-1 rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40">
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: time */}
          {step === 3 && (
            <div className="premium-card p-7">
              <h2 className="font-serif text-xl text-foreground mb-1">3. Escolha o horário</h2>
              <p className="text-sm text-muted-foreground mb-5 flex items-center gap-2">
                <Calendar size={14} className="text-gold" /> {fmtDateBR(selectedDate)}
              </p>
              {blockedDay ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Esta data está indisponível. Por favor, escolha outra.</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Nenhum horário configurado.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map(s => (
                    <button
                      key={s.time}
                      disabled={!s.available}
                      onClick={() => setSelectedTime(s.time)}
                      className={`py-2.5 rounded-md text-sm transition border ${
                        !s.available ? "border-border/50 text-muted-foreground/40 cursor-not-allowed line-through" :
                        selectedTime === s.time ? "border-gold bg-gold text-primary-foreground" :
                        "border-border text-foreground hover:border-gold/50"
                      }`}
                    >{s.time}</button>
                  ))}
                </div>
              )}
              <div className="mt-6 flex gap-2">
                <button onClick={() => setStep(2)} className="flex-1 rounded-md border border-border py-3 text-sm text-muted-foreground">Voltar</button>
                <button disabled={!selectedTime} onClick={() => setStep(4)} className="flex-1 rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40">
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 4: contact */}
          {step === 4 && (
            <div className="premium-card p-7">
              <h2 className="font-serif text-xl text-foreground mb-5">4. Seus dados</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gold uppercase tracking-wider">Nome completo</label>
                  <input
                    value={nome} onChange={e => setNome(e.target.value)}
                    className="mt-1 w-full bg-input border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-gold"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="text-xs text-gold uppercase tracking-wider">WhatsApp (com DDD)</label>
                  <input
                    value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                    className="mt-1 w-full bg-input border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-gold"
                    placeholder="11999999999"
                  />
                </div>
                <div className="bg-background/40 rounded-md p-4 text-sm space-y-1">
                  <div className="text-gold text-xs uppercase tracking-wider mb-2">Resumo</div>
                  <div><Clock size={12} className="inline text-gold mr-1" /> {fmtDateBR(selectedDate)} às {selectedTime}</div>
                  <div className="text-muted-foreground">{selectedSvcs.map(id => servicos.find(s => s.id === id)?.nome).join(", ")}</div>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button onClick={() => setStep(3)} className="flex-1 rounded-md border border-border py-3 text-sm text-muted-foreground">Voltar</button>
                <button
                  disabled={submitting || !nome || whatsapp.length < 10}
                  onClick={handleSubmit}
                  className="flex-1 rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-40 inline-flex items-center justify-center gap-2"
                >
                  <MessageCircle size={14} /> {submitting ? "Enviando..." : "Enviar solicitação"}
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
