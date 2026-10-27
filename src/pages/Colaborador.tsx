
import { useState } from "react";

interface ColaboradorProps {
  email: string;
  onBack: () => void;
}

type EstadoPedido = "Pendiente" | "Preparando" | "Listo" | "Entregado";

interface Pedido {
  id: number;
  cliente: string;
  productos: string;
  total: number;
  estado: EstadoPedido;
  hora: string;
}

interface Producto {
  id: number;
  nombre: string;
  categoria: "Cafetería" | "Pastelería";
  stock: number;
}

const pedidosIniciales: Pedido[] = [
  {
    id: 1001,
    cliente: "Cliente de ejemplo",
    productos: "2 Cappuccino, 1 Croissant",
    total: 7970,
    estado: "Pendiente",
    hora: "10:30",
  },
  {
    id: 1002,
    cliente: "Cliente de ejemplo",
    productos: "1 Latte, 2 Brownies",
    total: 8170,
    estado: "Preparando",
    hora: "10:45",
  },
  {
    id: 1003,
    cliente: "Cliente de ejemplo",
    productos: "1 Americano",
    total: 1990,
    estado: "Listo",
    hora: "11:00",
  },
];

const productosIniciales: Producto[] = [
  {
    id: 1,
    nombre: "Cappuccino",
    categoria: "Cafetería",
    stock: 25,
  },
  {
    id: 2,
    nombre: "Latte",
    categoria: "Cafetería",
    stock: 18,
  },
  {
    id: 3,
    nombre: "Croissant",
    categoria: "Pastelería",
    stock: 12,
  },
  {
    id: 4,
    nombre: "Brownie",
    categoria: "Pastelería",
    stock: 4,
  },
];

type Seccion = "resumen" | "pedidos" | "inventario";

export default function Colaborador({
  email,
  onBack,
}: ColaboradorProps) {
  const [seccion, setSeccion] = useState<Seccion>("resumen");
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciales);
  const [productos] = useState<Producto[]>(productosIniciales);
  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");

  const formatoPrecio = (precio: number) =>
    precio.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });

  const pedidosPendientes = pedidos.filter(
    (pedido) => pedido.estado === "Pendiente"
  ).length;

  const pedidosPreparando = pedidos.filter(
    (pedido) => pedido.estado === "Preparando"
  ).length;

  const pedidosListos = pedidos.filter(
    (pedido) => pedido.estado === "Listo"
  ).length;

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const coincideEstado =
      filtro === "Todos" || pedido.estado === filtro;

    const texto = (
      `${pedido.id} ${pedido.cliente} ${pedido.productos}`
    ).toLowerCase();

    return coincideEstado && texto.includes(busqueda.toLowerCase());
  });

  function cambiarEstado(id: number, estado: EstadoPedido) {
    setPedidos((actuales) =>
      actuales.map((pedido) =>
        pedido.id === id ? { ...pedido, estado } : pedido
      )
    );

    setMensaje(
      `El pedido #${id} ahora está "${estado}". Este cambio es temporal y todavía no se guarda en el servidor.`
    );
  }

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
        <div className="colaborador-welcome">
          <div>
            <span className="colaborador-eyebrow">
              ÁREA DE TRABAJO
            </span>

            <h2>¡Bienvenido al equipo! 🌷</h2>

            <p>
              Organiza los pedidos y revisa el inventario de la
              cafetería y pastelería.
            </p>

            <p>
              Sesión iniciada como: <strong>{email || "Colaborador"}</strong>
            </p>
          </div>

          <div className="colaborador-coffee-icon">☕</div>
        </div>

        <nav className="colaborador-tabs" aria-label="Área de trabajo">
          <button
            type="button"
            className={seccion === "resumen" ? "active" : ""}
            onClick={() => {
              setSeccion("resumen");
              setMensaje("");
            }}
          >
            Resumen
          </button>

          <button
            type="button"
            className={seccion === "pedidos" ? "active" : ""}
            onClick={() => {
              setSeccion("pedidos");
              setMensaje("");
            }}
          >
            Pedidos
          </button>

          <button
            type="button"
            className={seccion === "inventario" ? "active" : ""}
            onClick={() => {
              setSeccion("inventario");
              setMensaje("");
            }}
          >
            Inventario
          </button>
        </nav>

        {mensaje && (
          <div className="colaborador-notice" role="status">
            <span>{mensaje}</span>

            <button
              type="button"
              onClick={() => setMensaje("")}
              aria-label="Cerrar mensaje"
            >
              ×
            </button>
          </div>
        )}

        {seccion === "resumen" && (
          <>
            <section className="colaborador-stats">
              <article className="colaborador-stat-card">
                <span>📋</span>
                <p>Total de pedidos</p>
                <strong>{pedidos.length}</strong>
                <small>En el listado actual</small>
              </article>

              <article className="colaborador-stat-card">
                <span>🕒</span>
                <p>Pendientes</p>
                <strong>{pedidosPendientes}</strong>
                <small>Esperando preparación</small>
              </article>

              <article className="colaborador-stat-card">
                <span>👩‍🍳</span>
                <p>Preparando</p>
                <strong>{pedidosPreparando}</strong>
                <small>En preparación</small>
              </article>

              <article className="colaborador-stat-card">
                <span>✅</span>
                <p>Listos</p>
                <strong>{pedidosListos}</strong>
                <small>Listos para entregar</small>
              </article>
            </section>

            <section className="role-panel-card colaborador-panel">
              <div className="colaborador-section-heading">
                <div>
                  <h3>Pedidos recientes</h3>
                  <p>Consulta y actualiza el estado de cada pedido.</p>
                </div>

                <button
                  type="button"
                  className="colaborador-primary-button"
                  onClick={() => setSeccion("pedidos")}
                >
                  Ver todos los pedidos
                </button>
              </div>

              <div className="colaborador-table-wrapper">
                <table className="colaborador-table">
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Productos</th>
                      <th>Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pedidos.slice(0, 5).map((pedido) => (
                      <tr key={pedido.id}>
                        <td>#{pedido.id}</td>
                        <td>{pedido.productos}</td>
                        <td>{formatoPrecio(pedido.total)}</td>
                        <td>
                          <span
                            className={`colaborador-status ${pedido.estado.toLowerCase()}`}
                          >
                            {pedido.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="colaborador-demo-note">
                Datos demostrativos: los pedidos reales deben cargarse
                desde el backend.
              </p>
            </section>
          </>
        )}

        {seccion === "pedidos" && (
          <section className="role-panel-card colaborador-panel">
            <div className="colaborador-section-heading">
              <div>
                <h3>Gestión de pedidos</h3>
                <p>Busca pedidos y cambia su estado de preparación.</p>
              </div>
            </div>

            <div className="colaborador-filters">
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por pedido, cliente o producto..."
                aria-label="Buscar pedidos"
              />

              <select
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                aria-label="Filtrar por estado"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Preparando">Preparando</option>
                <option value="Listo">Listo</option>
                <option value="Entregado">Entregado</option>
              </select>
            </div>

            <div className="colaborador-orders-list">
              {pedidosFiltrados.length === 0 ? (
                <p>No se encontraron pedidos.</p>
              ) : (
                pedidosFiltrados.map((pedido) => (
                  <article
                    className="colaborador-order-card"
                    key={pedido.id}
                  >
                    <div className="colaborador-order-top">
                      <div>
                        <strong>Pedido #{pedido.id}</strong>
                        <p>{pedido.hora}</p>
                      </div>

                      <span
                        className={`colaborador-status ${pedido.estado.toLowerCase()}`}
                      >
                        {pedido.estado}
                      </span>
                    </div>

                    <p>
                      <strong>Cliente:</strong> {pedido.cliente}
                    </p>

                    <p>
                      <strong>Productos:</strong> {pedido.productos}
                    </p>

                    <div className="colaborador-order-bottom">
                      <strong>{formatoPrecio(pedido.total)}</strong>

                      <label>
                        Estado
                        <select
                          value={pedido.estado}
                          onChange={(e) =>
                            cambiarEstado(
                              pedido.id,
                              e.target.value as EstadoPedido
                            )
                          }
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Preparando">Preparando</option>
                          <option value="Listo">Listo</option>
                          <option value="Entregado">Entregado</option>
                        </select>
                      </label>
                    </div>
                  </article>
                ))
              )}
            </div>

            <p className="colaborador-demo-note">
              Los cambios de estado son temporales hasta conectarlos al
              backend.
            </p>
          </section>
        )}

        {seccion === "inventario" && (
          <section className="role-panel-card colaborador-panel">
            <div className="colaborador-section-heading">
              <div>
                <h3>Inventario disponible</h3>
                <p>Consulta las existencias del catálogo de ejemplo.</p>
              </div>
            </div>

            <div className="colaborador-table-wrapper">
              <table className="colaborador-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th>Disponibilidad</th>
                  </tr>
                </thead>

                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id}>
                      <td>{producto.nombre}</td>
                      <td>{producto.categoria}</td>
                      <td>{producto.stock}</td>
                      <td>
                        <span
                          className={
                            producto.stock <= 5
                              ? "colaborador-stock low"
                              : "colaborador-stock"
                          }
                        >
                          {producto.stock <= 5
                            ? "Stock bajo"
                            : "Disponible"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="colaborador-demo-note">
              El inventario todavía no está conectado a la base de datos.
            </p>
          </section>
        )}

        <footer className="colaborador-footer">
          <span>☕ Coffee Flower</span>
          <span>Panel de trabajo del colaborador</span>
        </footer>

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
