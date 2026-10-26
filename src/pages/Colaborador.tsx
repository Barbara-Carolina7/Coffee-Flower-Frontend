interface ColaboradorProps {
  email: string;
  onBack: () => void;
}

export default function Colaborador({ email, onBack }: ColaboradorProps) {
  return (
    <main className="role-dashboard">
      <header className="role-dashboard-header">
        <div>
          <h1>☕ Coffee Flower</h1>
          <p>Panel de colaborador</p>
        </div>
        <span className="role-badge">Colaborador</span>
      </header>

      <section className="role-dashboard-content">
        <h2>¡Bienvenido al equipo! 🌷</h2>
        <p>Sesión iniciada como: {email || "Colaborador"}</p>

        <div className="role-panel-card">
          <h3>Área de trabajo</h3>
          <p>Este es el panel de trabajo de los colaboradores.</p>
          <p>Las funciones de pedidos e inventario podrán conectarse al backend.</p>
        </div>

        <button
          type="button"
          className="role-back-button"
          onClick={onBack}
        >
          Volver a la tienda
        </button>
      </section>
    </main>
  );
}
