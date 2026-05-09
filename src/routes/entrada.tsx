import { createFileRoute, Link } from "@tanstack/react-router";
import { User, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/entrada")({
  head: () => ({ meta: [{ title: "Dra. Helena Martins — Bem-vinda" }] }),
  component: EntradaPage,
});

function EntradaPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-petrol/10 rounded-full blur-[120px]" />

      <div className="z-10 text-center max-w-md w-full">
        <div className="mb-8">
          <h1 className="font-serif text-4xl md:text-5xl text-foreground tracking-tight">
            Dra. Helena Martins
          </h1>
          <div className="gold-rule w-20 mx-auto mt-4 mb-4" />
          <p className="text-gold uppercase tracking-[0.3em] text-xs">
            Espaço de atendimento psicológico
          </p>
        </div>

        <div className="grid gap-4 w-full">
          <Link
            to="/"
            className="premium-card p-6 flex items-center gap-5 hover:border-gold transition group text-left"
          >
            <div className="h-12 w-12 rounded-full bg-gold/10 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-primary-foreground transition-colors">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground">Sou cliente</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Quero conhecer a clínica ou agendar uma consulta</p>
            </div>
          </Link>

          <Link
            to="/profissional"
            className="premium-card p-6 flex items-center gap-5 hover:border-gold transition group text-left"
          >
            <div className="h-12 w-12 rounded-full bg-petrol/20 flex items-center justify-center text-gold/80 group-hover:bg-gold group-hover:text-primary-foreground transition-colors">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-lg font-medium text-foreground">Sou profissional</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Acessar meu painel de agendamentos e horários</p>
            </div>
          </Link>
        </div>

        <p className="mt-12 text-[10px] text-muted-foreground uppercase tracking-widest opacity-50">
          Excelência em Saúde Mental · Estilo & Cuidado
        </p>
      </div>
    </div>
  );
}
