import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, User, ArrowLeft, Loader2 } from "lucide-react";

export const Route = createFileRoute("/profissional")({
  head: () => ({ meta: [{ title: "Login Profissional — Dra. Helena Martins" }] }),
  component: ProfissionalLoginPage,
});

function ProfissionalLoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    especialidade: "",
    whatsapp: "",
    senha: "",
  });
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { data, error } = await supabase
          .from("profissionais")
          .select("*")
          .ilike("nome", formData.nome.trim())
          .eq("senha", formData.senha)
          .eq("ativo", true)
          .maybeSingle();

        if (error || !data) {
          toast.error("Nome ou senha incorretos");
          return;
        }

        sessionStorage.setItem("profissional_id", data.id);
        sessionStorage.setItem("profissional_nome", data.nome);
        toast.success(`Bem-vindo(a), ${data.nome}`);
        if ((data as { role?: string }).role === "owner") {
          sessionStorage.setItem("master_auth", "true");
          navigate({ to: "/dashboard-proprietario" });
        } else {
          navigate({ to: "/painel-profissional" });
        }
      } else {
        // Simple registration for demo
        const { data, error } = await supabase
          .from("profissionais")
          .insert({
            nome: formData.nome,
            especialidade: formData.especialidade,
            whatsapp: formData.whatsapp,
            senha: formData.senha,
            ativo: true,
          })
          .select()
          .single();

        if (error) {
          toast.error("Erro ao cadastrar: " + error.message);
          return;
        }

        sessionStorage.setItem("profissional_id", data.id);
        sessionStorage.setItem("profissional_nome", data.nome);
        toast.success("Cadastro realizado com sucesso!");
        navigate({ to: "/painel-profissional" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link to="/entrada" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary mb-8 transition-colors font-bold uppercase tracking-widest">
          <ArrowLeft size={14} /> Voltar
        </Link>

        <form onSubmit={handleSubmit} className="premium-card p-8">
          <div className="text-center mb-8">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
              <Lock size={32} />
            </div>
            <h1 className="font-sans font-extrabold text-3xl text-foreground tracking-tighter">Área do Profissional</h1>
            <p className="text-xs text-muted-foreground mt-2 font-medium">
              {mode === "login" ? "Acesse seu painel" : "Crie sua conta"}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] text-primary uppercase tracking-widest block mb-1.5 font-bold">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  required
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Seu nome"
                  className="w-full bg-input border border-border rounded-md pl-10 pr-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {mode === "register" && (
              <>
                <div>
                  <label className="text-[11px] text-primary uppercase tracking-widest block mb-1.5 font-bold">Especialidade</label>
                  <input
                    required
                    value={formData.especialidade}
                    onChange={e => setFormData({ ...formData, especialidade: e.target.value })}
                    placeholder="Ex: Psicóloga Clínica"
                     className="w-full bg-input border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-primary uppercase tracking-widest block mb-1.5 font-bold">WhatsApp</label>
                  <input
                    required
                    value={formData.whatsapp}
                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value.replace(/\D/g, "") })}
                    placeholder="11999999999"
                    className="w-full bg-input border border-border rounded-md px-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[11px] text-primary uppercase tracking-widest block mb-1.5 font-bold">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input
                  required
                  type="password"
                  value={formData.senha}
                  onChange={e => setFormData({ ...formData, senha: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-input border border-border rounded-md pl-10 pr-4 py-3 text-foreground outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : mode === "login" ? "Entrar no Painel" : "Criar Conta Profissional"}
          </button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-xs text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              {mode === "login" ? "Não tem uma conta? Cadastre-se" : "Já tem uma conta? Faça login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
