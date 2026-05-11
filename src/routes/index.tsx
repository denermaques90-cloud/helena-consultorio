import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import heroCollage from "@/assets/hero-collage.png";
import portrait from "@/assets/helena-portrait.png";
import recepcao from "@/assets/recepcao.png";
import sala1 from "@/assets/sala-1.png";
import sala2 from "@/assets/sala-2.png";
import certificado from "@/assets/certificado.png";
import {
  Calendar, MessageCircle, CheckCircle2, Heart, Ear, Shield, Sparkles,
  Brain, Users, Activity, Leaf, ChevronDown, ArrowRight,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dra. Helena Martins — Psicóloga Clínica em Guarulhos" },
      { name: "description", content: "Atendimento psicológico para adultos: ansiedade, autoestima, relacionamentos. Presencial em Guarulhos e online. CRP 06/123456." },
    ],
  }),
  component: HomePage,
});

const especialidades = [
  { icon: Brain, title: "Ansiedade", desc: "Acompanhamento para lidar com sintomas de ansiedade no dia a dia." },
  { icon: Sparkles, title: "Autoestima", desc: "Processo de autoconhecimento e fortalecimento pessoal." },
  { icon: Users, title: "Relacionamentos", desc: "Suporte para questões afetivas, familiares e interpessoais." },
  { icon: Activity, title: "Estresse", desc: "Estratégias para equilíbrio emocional e qualidade de vida." },
  { icon: Leaf, title: "Desenvolvimento emocional", desc: "Trabalho contínuo de evolução pessoal e maturidade afetiva." },
  { icon: Heart, title: "Terapia para adultos", desc: "Atendimento individual ético, contínuo e individualizado." },
];

const valores = [
  { icon: Heart, title: "Atendimento humanizado" },
  { icon: Ear, title: "Escuta acolhedora" },
  { icon: Shield, title: "Ética profissional" },
  { icon: Sparkles, title: "Ambiente seguro" },
];

const faqs = [
  {
    q: "O atendimento pode ser online?",
    a: "Sim. O atendimento pode ser realizado online, de forma prática e segura, conforme disponibilidade da agenda.",
  },
  {
    q: "Quanto tempo dura uma sessão?",
    a: "As sessões geralmente têm duração média de 50 minutos.",
  },
  {
    q: "Atende convênio?",
    a: "No momento, os atendimentos são particulares. Caso necessário, é possível solicitar recibo para reembolso, conforme as regras do seu convênio.",
  },
  {
    q: "Como funciona o agendamento?",
    a: "Você escolhe uma modalidade, seleciona um horário disponível e envia sua solicitação. A confirmação é feita pelo WhatsApp.",
  },
  {
    q: "A primeira consulta é obrigatória?",
    a: "A primeira consulta é um momento inicial para compreender sua demanda e orientar os próximos passos do acompanhamento.",
  },
];

function HomePage() {
  const hasSeenEntrada = typeof window !== "undefined" && (sessionStorage.getItem("seen_entrada") === "true" || sessionStorage.getItem("profissional_id"));
  
  if (!hasSeenEntrada) {
    return <Navigate to="/entrada" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />

      {/* HERO */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[#F4F1EA]/50">
          <div className="absolute inset-0 bg-gradient-to-r from-[#F7F5F0] via-[#F7F5F0]/80 to-transparent z-10" />
          <img src={heroCollage} alt="" className="h-full w-full object-cover opacity-30 mix-blend-multiply" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 pt-32 pb-20 w-full">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-5 font-semibold">Psicóloga Clínica · CRP 06/123456</p>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-7xl text-foreground leading-[1.1] mb-6">
              Cuidado psicológico com <br />
              <span className="text-primary italic">acolhimento</span>, escuta e <br />
              profissionalismo
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              Atendimento psicológico para adultos, com foco em ansiedade, autoestima, relacionamentos e desenvolvimento emocional.
            </p>
            <div className="mt-3 text-sm text-foreground/80">
              <span className="font-serif text-base">Dra. Helena Martins</span> · Psicóloga Clínica
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/agendar"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                <Calendar size={16} /> Agendar consulta
              </Link>
              <a
                href="#sobre"
                className="inline-flex items-center gap-2 rounded-md border border-primary/20 px-6 py-3.5 text-sm font-medium text-foreground transition hover:bg-primary/5"
              >
                Conhecer atendimento <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* SOBRE */}
      <section id="sobre" className="py-24 px-5">
        <div className="mx-auto max-w-6xl grid gap-12 md:grid-cols-2 items-center">
          <div className="relative">
            <img src={portrait} alt="Dra. Helena Martins, psicóloga clínica" className="rounded-lg w-full object-cover aspect-[4/3]" />
            <div className="absolute -bottom-4 -right-4 hidden md:block bg-white border border-primary/10 px-6 py-4 rounded shadow-xl">
              <p className="text-xs uppercase tracking-[0.2em] text-primary font-bold">+10 anos</p>
              <p className="text-sm text-foreground/80">de experiência clínica</p>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Sobre mim</p>
            <h2 className="mt-3 font-serif text-3xl md:text-5xl text-foreground">
              Escuta cuidadosa, ética e individualizada
            </h2>
            <div className="h-1 w-20 bg-primary/20 mt-6" />
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Sou psicóloga clínica e atuo com uma escuta acolhedora, ética e individualizada. 
              Meu objetivo é oferecer um espaço seguro para que cada pessoa possa compreender 
              melhor suas emoções, enfrentar desafios e desenvolver uma relação mais saudável 
              consigo mesma.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {valores.map((v) => (
                <div key={v.title} className="premium-card p-4 flex items-center gap-3">
                  <v.icon size={18} className="text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground/80 font-medium">{v.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ESPECIALIDADES */}
      <section id="especialidades" className="py-24 px-5 bg-card/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Áreas de atuação</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl text-foreground">Especialidades</h2>
            <div className="h-1 w-20 bg-primary/20 mt-4 mx-auto" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {especialidades.map((e) => (
              <div key={e.title} className="premium-card p-8 transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 duration-300">
                <e.icon size={32} className="text-primary mb-6" />
                <h3 className="font-serif text-2xl text-foreground mb-3">{e.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AMBIENTE */}
      <section id="ambiente" className="py-24 px-5">
        <div className="mx-auto max-w-6xl grid gap-12 md:grid-cols-2 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Ambiente</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl text-foreground leading-tight">
              Um espaço pensado para o seu cuidado e privacidade
            </h2>
            <div className="h-1 w-20 bg-primary/20 mt-6" />
            <p className="mt-8 text-muted-foreground leading-relaxed text-lg">
              Um espaço preparado para proporcionar conforto, privacidade e tranquilidade durante o atendimento.
            </p>
            <p className="mt-6 text-sm italic text-primary/70 font-medium">— Recepção acolhedora e reservada.</p>
          </div>
          <img src={recepcao} alt="Recepção do consultório" className="rounded-lg w-full object-cover aspect-[4/3]" />
        </div>
      </section>

      {/* ESPAÇO TERAPÊUTICO */}
      <section className="py-24 px-5 bg-card/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Galeria</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl text-foreground">Espaço Terapêutico</h2>
            <div className="h-1 w-20 bg-primary/20 mt-4 mx-auto" />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <figure>
              <img src={sala1} alt="Sala de atendimento" className="rounded-lg w-full object-cover aspect-[4/3]" />
              <figcaption className="mt-3 text-sm text-center italic text-muted-foreground">
                Sala preparada para escuta, privacidade e conforto.
              </figcaption>
            </figure>
            <figure>
              <img src={sala2} alt="Sala em outro ângulo" className="rounded-lg w-full object-cover aspect-[4/3]" />
              <figcaption className="mt-3 text-sm text-center italic text-muted-foreground">
                Ambiente calmo, seguro e profissional.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* FORMAÇÃO */}
      <section className="py-24 px-5">
        <div className="mx-auto max-w-6xl grid gap-12 md:grid-cols-2 items-center">
          <img src={certificado} alt="Certificado de registro profissional" className="rounded-lg w-full object-cover aspect-[4/3]" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Formação</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl text-foreground">
              Compromisso profissional
            </h2>
            <div className="h-1 w-20 bg-primary/20 mt-6" />
            <p className="mt-6 text-muted-foreground leading-relaxed">
              Formação contínua, atuação ética e compromisso com um atendimento psicológico responsável.
            </p>
            <div className="mt-6 inline-flex items-center gap-3 px-4 py-3 premium-card">
              <CheckCircle2 size={18} className="text-primary" />
              <span className="text-sm text-foreground">Registro ativo no Conselho Regional de Psicologia · CRP 06/123456</span>
            </div>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-24 px-5 bg-card/30">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Processo</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl text-foreground">Como funciona</h2>
            <div className="h-1 w-20 bg-primary/20 mt-4 mx-auto" />
            <p className="mt-6 text-muted-foreground max-w-2xl mx-auto">
              O agendamento online facilita o primeiro contato e permite que você escolha um horário disponível com mais praticidade.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Escolha o melhor horário", d: "Selecione a modalidade e veja a agenda disponível." },
              { n: "02", t: "Envie sua solicitação", d: "Informe seus dados de contato em poucos passos." },
              { n: "03", t: "Receba a confirmação", d: "A confirmação será feita diretamente pelo WhatsApp." },
            ].map((s) => (
              <div key={s.n} className="premium-card p-7 text-center">
                <div className="font-serif text-4xl text-primary">{s.n}</div>
                <h3 className="mt-3 font-serif text-xl text-foreground">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/agendar"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Calendar size={16} /> Iniciar agendamento
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-5">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold">Dúvidas</p>
            <h2 className="mt-3 font-serif text-3xl md:text-4xl text-foreground">Perguntas frequentes</h2>
            <div className="h-1 w-20 bg-primary/20 mt-4 mx-auto" />
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 px-5">
        <div className="mx-auto max-w-4xl premium-card p-10 md:p-14 text-center">
          <MessageCircle size={32} className="text-primary mx-auto" />
          <h2 className="mt-5 font-serif text-3xl md:text-4xl text-foreground">
            Pronto para dar o primeiro passo?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Reserve um horário e dê início ao seu processo terapêutico em um ambiente seguro e profissional.
          </p>
          <Link
            to="/agendar"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground"
          >
            <Calendar size={16} /> Agendar consulta
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="premium-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="font-serif text-xl text-foreground pr-4 font-semibold">{q}</span>
        <ChevronDown size={18} className={`text-primary flex-shrink-0 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</div>}
    </div>
  );
}
