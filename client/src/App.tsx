import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import type { ClientSlug } from "../../drizzle/schema";

// Detecta o cliente pelo subdomínio:
// aliny.gow.agency → alinyrayze
// junior.gow.agency → juniorlopes
// localhost/alinyrayze ou /juniorlopes → fallback para dev
function getClientFromHostname(): ClientSlug | null {
  const sub = window.location.hostname.split(".")[0].toLowerCase();
  if (sub === "aliny") return "alinyrayze";
  if (sub === "junior") return "juniorlopes";
  return null;
}

function Router() {
  const clientFromHost = getClientFromHostname();

  // Produção: subdomínio detectado → mostra direto na raiz
  if (clientFromHost) {
    return (
      <Switch>
        <Route path="*" component={() => <Home client={clientFromHost} />} />
      </Switch>
    );
  }

  // Dev local: usa rotas por path
  return (
    <Switch>
      <Route path="/alinyrayze" component={() => <Home client="alinyrayze" />} />
      <Route path="/juniorlopes" component={() => <Home client="juniorlopes" />} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
