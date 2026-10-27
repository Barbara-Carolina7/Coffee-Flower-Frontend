
import { useState } from "react";
import { useAuth } from "react-oidc-context";

interface DashboardProps {
  email: string;
  onBack: () => void;
}

const API_URL = (
  import.meta.env.VITE_API_URL as string | undefined
)?.replace(/\/$/, "") ?? "";

export default function Dashboard({ email, onBack }: DashboardProps) {
  const auth = useAuth();
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function generarInforme() {
    if (!API_URL) {
      setMensaje("Falta configurar VITE_API_URL.");
      return;
    }

    const token = auth.user?.id_token;

    if (!auth.isAuthenticated || !token) {
      setMensaje("Debes iniciar sesión como administrador.");
      return;
    }

    setGenerando(true);
    setMensaje("");

    try {
      const respuesta = await fetch(`${API_URL}/api/reportes/compras`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.mensaje || `Error HTTP ${respuesta.status}`
        );
      }

      setMensaje(
        `${resultado.mensaje} Total de pedidos: ${resultado.cantidadPedidos}.`
      );
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : "No se pudo enviar el informe."
      );
    } finally {
      setGenerando(false);
    }
  }

  return (
    <main className="role-dashboard">
      <header className="role-dashboard-header">
        <div>
          <h1>☕ Coffee Flower</h1>
          <p>Panel de administración</p>
        </div>
        <span className="role-badge">Administrador</span>
      </header>

      <section className="role-dashboard-content">
        <h2>¡Bienvenido, administrador! 🌸</h2>
        <p>Sesión iniciada como: {email || "Administrador"}</p>

        <div className="role-panel-card">
          <h3>Informe de compras</h3>
          <p>
            Genera un PDF con todos los pedidos registrados,
            sus clientes, productos, fechas, estados y totales.
          </p>

          <button
            type="button"
            className="role-back-button"
            onClick={() => void generarInforme()}
            disabled={generando}
          >
            {generando
              ? "Generando y enviando..."
              : "Generar informe PDF"}
          </button>

          {mensaje && (
            <p role="status" aria-live="polite">
              {mensaje}
            </p>
          )}
        </div>

        <button
          type="button"
          className="role-back-button"
          onClick={onBack}
        >
          Volver al panel
        </button>
      </section>
    </main>
  );
}
