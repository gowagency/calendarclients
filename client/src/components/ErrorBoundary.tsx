import React from "react";

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg)",
            color: "var(--text-primary)",
            fontFamily: "Inter, system-ui, sans-serif",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "DM Sans, system-ui",
                fontSize: "1.5rem",
                fontWeight: 400,
                marginBottom: "0.5rem",
              }}
            >
              Algo deu errado
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              {this.state.error?.message || "Erro inesperado. Recarregue a página."}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "1.5rem",
                padding: "0.6rem 1.25rem",
                background: "var(--text-primary)",
                color: "var(--bg)",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
