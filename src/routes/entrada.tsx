import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { User, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/entrada")({
  head: () => ({ meta: [{ title: "Clínica Dra. Helena Martins — Bem-vinda" }] }),
  component: EntradaPage,
});

function EntradaPage() {
  const navigate = useNavigate();

  const handleClientClick = (e: React.MouseEvent) => {
    e.preventDefault();
    sessionStorage.setItem("seen_entrada", "true");
    navigate({ to: "/" });
  };
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />

      <div className="z-10 text-center max-w-md w-full">
        <div className="mb-12">
          <h1 className="font-serif text-5xl md:text-6xl text-foreground tracking-tight">
            Dra. Helena Martins
          </h1>
          <div className="h-1 w-20 bg-primary/20 mx-auto mt-6 mb-4" />
          <p className="text-primary uppercase tracking-[0.4em] text-xs font-bold">
            Psicologia Clínica Premium
          </p>
        </div>

        <div className="grid gap-4 w-full">
          <button
            onClick={handleClientClick}
            className="premium-card p-8 flex items-center gap-6 hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition group text-left w-full"
          >
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-xl font-serif text-foreground">Sou cliente</h2>
              <p className="text-sm text-muted-foreground mt-1">Conhecer clínica ou agendar consulta</p>
            </div>
          </button>

          <Link
            to="/profissional"
            className="premium-card p-8 flex items-center gap-6 hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition group text-left w-full"
          >
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-xl font-serif text-foreground">Sou profissional</h2>
              <p className="text-sm text-muted-foreground mt-1">Acesso ao painel administrativo</p>
            </div>
          </Link>
        </div>

        <p className="mt-16 text-[10px] text-muted-foreground uppercase tracking-widest opacity-50 font-bold">
          Excelência em Saúde Mental · Cuidado & Ética
        </p>
      </div>
    </div>
  );
}
