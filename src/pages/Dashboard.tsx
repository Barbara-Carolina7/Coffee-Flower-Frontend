
import { useMemo, useState } from "react";
import "./Dashboard.css";

interface DashboardProps {
  email: string;
  onBack: () => void;
}

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: "Café" | "Pastelería";
  disponible: boolean;
}

const productosIniciales: Producto[] = [
  {
    id: 1,
    nombre: "Latte Vainilla",
    descripcion: "Espresso, leche cremosa y vainilla.",
    precio: 3490,
    categoria: "Café",
    disponible: true,
  },
  {
    id: 2,
    nombre: "Cappuccino",
    descripcion: "Espresso intenso con espuma de leche.",
    precio: 2990,
    categoria: "Café",
    disponible: true,
  },
  {
    id: 3,
    nombre: "Croissant",
    descripcion: "Hojaldre dorado y recién horneado.",
    precio: 2290,
    categoria: "Pastelería",
    disponible: true,
  },
  {
    id: 4,
    nombre: "Torta de chocolate",
    descripcion: "Bizcocho con ganache de chocolate.",
    precio: 3990,
    categoria: "Pastelería",
    disponible: true,
  },
];

const formatoCLP = (valor: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(valor);

const productoVacio = (): Omit<Producto, "id"> => ({
  nombre: "",
  descripcion: "",
  precio: 0,
  categoria: "Café",
  disponible: true,
});

export default function Dashboard({
  email,
  onBack,
}: DashboardProps) {
  const [productos, setProductos] =
    useState<Producto[]>(productosIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("Todos");
  const [editando, setEditando] = useState<Producto | null>(null);
  const [formulario, setFormulario] =
    useState<Omit<Producto, "id">>(productoVacio());
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mensaje, setMensaje] = useState(
    "Vista previa: los cambios aún no se guardan en la base de datos."
  );
  const [seccion, setSeccion] = useState<
    "resumen" | "productos" | "pedidos" | "informes"
  >("resumen");

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    return productos.filter((producto) => {
      const coincideTexto =
        producto.nombre.toLowerCase().includes(texto) ||
        producto.descripcion.toLowerCase().includes(texto);

      const coincideCategoria =
        categoria === "Todos" || producto.categoria === categoria;

      return coincideTexto && coincideCategoria;
    });
  }, [productos, busqueda, categoria]);

  const abrirNuevo = () => {
    setEditando(null);
    setFormulario(productoVacio());
    setModalAbierto(true);
  };

  const abrirEdicion = (producto: Producto) => {
    setEditando(producto);
    setFormulario({
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      categoria: producto.categoria,
      disponible: producto.disponible,
    });
    setModalAbierto(true);
  };

  const guardarProducto = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formulario.nombre.trim() || formulario.precio <= 0) {
      setMensaje("Ingresa un nombre y un precio mayor que cero.");
      return;
    }

    if (editando) {
      setProductos((actuales) =>
        actuales.map((producto) =>
          producto.id === editando.id
            ? { ...formulario, id: editando.id }
            : producto
        )
      );
      setMensaje("Producto actualizado en la vista previa local.");
    } else {
      const nuevo: Producto = {
        ...formulario,
        id: Math.max(0, ...productos.map((p) => p.id)) + 1,
      };

      setProductos((actuales) => [...actuales, nuevo]);
      setMensaje("Producto agregado a la vista previa local.");
    }

    setModalAbierto(false);
  };

  const eliminarProducto = (producto: Producto) => {
    if (!window.confirm(`¿Eliminar "${producto.nombre}" de la vista previa?`)) {
      return;
    }

    setProductos((actuales) =>
      actuales.filter((p) => p.id !== producto.id)
    );
    setMensaje("Producto eliminado de la vista previa local.");
  };

  const cambiarDisponibilidad = (id: number) => {
    setProductos((actuales) =>
      actuales.map((producto) =>
        producto.id === id
          ? { ...producto, disponible: !producto.disponible }
          : producto
      )
    );
    setMensaje("Disponibilidad modificada solo en la vista previa.");
  };

  const mostrarPendiente = () => {
    setMensaje(
      "Pendiente de conectar con el backend. No se ha enviado ninguna solicitud."
    );
  };

  const stockDisponible = productos.filter((p) => p.disponible).length;

  const valorCatalogo = productos.reduce(
    (total, producto) => total + producto.precio,
    0
  );

  return (
    <main className="role-dashboard admin-dashboard">
      <header className="role-dashboard-header">
        <div>
          <h1>☕ Coffee Flower</h1>
          <p>Panel de administración</p>
        </div>
        <span className="role-badge">Administrador</span>
      </header>

      <section className="admin-welcome">
        <h2>¡Bienvenido, administrador! 🌸</h2>
        <p>Sesión iniciada como: {email || "Administrador"}</p>
      </section>

      <nav className="admin-menu" aria-label="Secciones de administración">
        {[
          ["resumen", "🏠 Resumen"],
          ["productos", "☕ Productos"],
          ["pedidos", "🛍️ Pedidos"],
          ["informes", "📄 Informes"],
        ].map(([id, texto]) => (
          <button
            key={id}
            type="button"
            className={seccion === id ? "admin-menu-active" : ""}
            onClick={() => setSeccion(id as typeof seccion)}
          >
            {texto}
          </button>
        ))}
      </nav>

      {mensaje && (
        <p className="admin-notice" role="status" aria-live="polite">
          {mensaje}
        </p>
      )}

      {seccion === "resumen" && (
        <>
          <section className="admin-stats">
            <article className="admin-stat">
              <span>☕</span>
              <p>Productos registrados</p>
              <strong>{productos.length}</strong>
            </article>

            <article className="admin-stat">
              <span>🌸</span>
              <p>Productos disponibles</p>
              <strong>{stockDisponible}</strong>
            </article>

            <article className="admin-stat">
              <span>💰</span>
              <p>Valor del catálogo</p>
              <strong>{formatoCLP(valorCatalogo)}</strong>
            </article>

            <article className="admin-stat">
              <span>🛍️</span>
              <p>Pedidos registrados</p>
              <strong>—</strong>
              <small>Pendiente de conectar</small>
            </article>
          </section>

          <section className="role-panel-card">
            <h3>Accesos rápidos</h3>
            <p>Administra el catálogo y consulta las demás funciones.</p>
            <div className="admin-actions">
              <button
                type="button"
                className="role-back-button"
                onClick={() => setSeccion("productos")}
              >
                Gestionar productos
              </button>
              <button
                type="button"
                className="role-back-button"
                onClick={() => setSeccion("pedidos")}
              >
                Ver pedidos
              </button>
              <button
                type="button"
                className="role-back-button"
                onClick={() => setSeccion("informes")}
              >
                Informes PDF
              </button>
            </div>
          </section>
        </>
      )}

      {seccion === "productos" && (
        <section className="role-panel-card admin-products">
          <div className="admin-section-heading">
            <div>
              <h3>Catálogo de productos</h3>
              <p>Gestiona los cafés y la pastelería.</p>
            </div>
            <button
              type="button"
              className="role-back-button"
              onClick={abrirNuevo}
            >
              + Agregar producto
            </button>
          </div>

          <div className="admin-filters">
            <input
              aria-label="Buscar productos"
              type="search"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />

            <select
              aria-label="Filtrar por categoría"
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
            >
              <option>Todos</option>
              <option>Café</option>
              <option>Pastelería</option>
            </select>
          </div>

          <div className="admin-product-list">
            {productosFiltrados.map((producto) => (
              <article className="admin-product" key={producto.id}>
                <div className="admin-product-icon">
                  {producto.categoria === "Café" ? "☕" : "🍰"}
                </div>

                <div className="admin-product-info">
                  <h4>{producto.nombre}</h4>
                  <p>{producto.descripcion}</p>
                  <strong>{formatoCLP(producto.precio)}</strong>
                  <small>
                    {producto.categoria} ·{" "}
                    {producto.disponible ? "Disponible" : "No disponible"}
                  </small>
                </div>

                <div className="admin-product-actions">
                  <button
                    type="button"
                    onClick={() => abrirEdicion(producto)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiarDisponibilidad(producto.id)}
                  >
                    {producto.disponible ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    type="button"
                    className="admin-delete"
                    onClick={() => eliminarProducto(producto)}
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            ))}

            {productosFiltrados.length === 0 && (
              <p>No hay productos que coincidan con la búsqueda.</p>
            )}
          </div>
        </section>
      )}

      {seccion === "pedidos" && (
        <section className="role-panel-card">
          <h3>Gestión de pedidos</h3>
          <p>
            Aquí se mostrarán las compras, sus clientes, productos, fechas,
            totales y estados cuando esté disponible la consulta del backend.
          </p>
          <div className="admin-pending">
            <span>🛍️</span>
            <strong>Pedidos pendientes de conexión</strong>
            <p>
              Aún no se consulta ni modifica ninguna compra real.
            </p>
          </div>
          <button
            type="button"
            className="role-back-button"
            onClick={mostrarPendiente}
          >
            Consultar pedidos
          </button>
        </section>
      )}

      {seccion === "informes" && (
        <section className="role-panel-card">
          <h3>Informes de compras</h3>
          <p>
            El informe deberá incluir pedidos, clientes, productos, fechas,
            estados y totales.
          </p>
          <div className="admin-pending">
            <span>📄</span>
            <strong>Generación de PDF pendiente de conexión</strong>
            <p>
              El backend debe implementar la generación del documento y el
              envío al correo del administrador.
            </p>
          </div>
          <button
            type="button"
            className="role-back-button"
            onClick={mostrarPendiente}
          >
            Generar informe PDF
          </button>
        </section>
      )}

      {modalAbierto && (
        <div className="admin-modal-backdrop">
          <section
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-modal-title"
          >
            <h3 id="admin-modal-title">
              {editando ? "Editar producto" : "Agregar producto"}
            </h3>

            <form onSubmit={guardarProducto}>
              <label>
                Nombre
                <input
                  required
                  value={formulario.nombre}
                  onChange={(event) =>
                    setFormulario({
                      ...formulario,
                      nombre: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Descripción
                <textarea
                  value={formulario.descripcion}
                  onChange={(event) =>
                    setFormulario({
                      ...formulario,
                      descripcion: event.target.value,
                    })
                  }
                />
              </label>

              <label>
                Precio (CLP)
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={formulario.precio || ""}
                  onChange={(event) =>
                    setFormulario({
                      ...formulario,
                      precio: Number(event.target.value),
                    })
                  }
                />
              </label>

              <label>
                Categoría
                <select
                  value={formulario.categoria}
                  onChange={(event) =>
                    setFormulario({
                      ...formulario,
                      categoria: event.target.value as Producto["categoria"],
                    })
                  }
                >
                  <option value="Café">Café</option>
                  <option value="Pastelería">Pastelería</option>
                </select>
              </label>

              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={formulario.disponible}
                  onChange={(event) =>
                    setFormulario({
                      ...formulario,
                      disponible: event.target.checked,
                    })
                  }
                />
                Producto disponible
              </label>

              <div className="admin-modal-actions">
                <button type="submit" className="role-back-button">
                  Guardar en vista previa
                </button>
                <button
                  type="button"
                  className="admin-cancel-button"
                  onClick={() => setModalAbierto(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <button
        type="button"
        className="role-back-button admin-back"
        onClick={onBack}
      >
        Volver al panel
      </button>
    </main>
  );
}
