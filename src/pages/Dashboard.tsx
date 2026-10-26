interface DashboardProps {
  email: string;
  onBack: () => void;
}

export default function Dashboard({ email, onBack }: DashboardProps) {
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
          <h3>Administración</h3>
          <p>Bienvenido al panel de administración de Coffee Flower.</p>
          <p>Desde aquí se podrán incorporar funciones para gestionar productos, pedidos y usuarios.</p>
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
