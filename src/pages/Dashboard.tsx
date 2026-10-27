
import { useState } from "react";

type DashboardProps = {
  email: string;
  onBack: () => void;
};

type Producto = {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
};

type Pedido = {
  id: number;
  cliente: string;
  total: number;
  estado: string;
};

export default function Dashboard({ email, onBack }: DashboardProps) {
  const [seccion, setSeccion] = useState("resumen");

  const [productos, setProductos] = useState<Producto[]>([
    {
      id: 1,
      nombre: "Cappuccino",
      categoria: "Cafetería",
      precio: 2990,
      stock: 25,
    },
    {
      id: 2,
      nombre: "Latte",
      categoria: "Cafetería",
      precio: 3190,
      stock: 18,
    },
    {
      id: 3,
      nombre: "Croissant",
      categoria: "Pastelería",
      precio: 1990,
      stock: 12,
    },
  ]);

  const [pedidos] = useState<Pedido[]>([
    {
      id: 1001,
      cliente: "Cliente de ejemplo",
      total: 7980,
      estado: "Pendiente",
    },
    {
      id: 1002,
      cliente: "Cliente de ejemplo",
      total: 6170,
      estado: "Preparando",
    },
  ]);

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("Cafetería");
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [nuevoStock, setNuevoStock] = useState("");

  const formatoPrecio = (precio: number) =>
    precio.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });

  const agregarProducto = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !nuevoNombre.trim() ||
      Number(nuevoPrecio) <= 0 ||
      nuevoStock === "" ||
      Number(nuevoStock) < 0
    ) {
      alert("Completa correctamente todos los campos.");
      return;
    }

    const producto: Producto = {
      id: Date.now(),
      nombre: nuevoNombre.trim(),
      categoria: nuevaCategoria,
      precio: Number(nuevoPrecio),
      stock: Number(nuevoStock),
    };

    setProductos((actuales) => [...actuales, producto]);
    setNuevoNombre("");
    setNuevoPrecio("");
    setNuevoStock("");
  };

  const eliminarProducto = (id: number) => {
    const confirmar = window.confirm(
      "¿Seguro que deseas eliminar este producto?"
    );

    if (confirmar) {
      setProductos((actuales) =>
        actuales.filter((producto) => producto.id !== id)
      );
    }
  };

  const totalProductos = productos.length;

  const stockTotal = productos.reduce(
    (total, producto) => total + producto.stock,
    0
  );

  const ventasEjemplo = pedidos.reduce(
    (total, pedido) => total + pedido.total,
    0
  );

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">☕</span>

          <div>
            <h2>Coffee Flower</h2>
            <p>Panel administrativo</p>
          </div>
        </div>

        <nav className="admin-navigation">
          <button
            type="button"
            className={seccion === "resumen" ? "active" : ""}
            onClick={() => setSeccion("resumen")}
          >
            <span>▦</span> Resumen
          </button>

          <button
            type="button"
            className={seccion === "productos" ? "active" : ""}
            onClick={() => setSeccion("productos")}
          >
            <span>☕</span> Productos
          </button>

          <button
            type="button"
            className={seccion === "pedidos" ? "active" : ""}
            onClick={() => setSeccion("pedidos")}
          >
            <span>▤</span> Pedidos
          </button>

          <button
            type="button"
            className={seccion === "informes" ? "active" : ""}
            onClick={() => setSeccion("informes")}
          >
            <span>▥</span> Informes
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <span>●</span> Administración
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">
              COFFEE FLOWER / ADMINISTRACIÓN
            </p>

            <h1>
              {seccion === "resumen" && "Resumen general"}
              {seccion === "productos" && "Gestión de productos"}
              {seccion === "pedidos" && "Gestión de pedidos"}
              {seccion === "informes" && "Informes"}
            </h1>

            <p className="admin-subtitle">
              Administra tu cafetería y pastelería desde un solo lugar.
            </p>
          </div>

          <div className="admin-user">
            <span className="admin-avatar">A</span>

            <div>
              <strong>Administrador</strong>
              <small>{email || "Sesión iniciada"}</small>
            </div>

            <button
              type="button"
              className="admin-primary-button"
              onClick={onBack}
            >
              Volver
            </button>
          </div>
        </header>

        {seccion === "resumen" && (
          <>
            <section className="admin-welcome">
              <div>
                <span className="admin-welcome-tag">
                  ✦ PANEL DE CONTROL
                </span>

                <h2>¡Bienvenido a Coffee Flower!</h2>

                <p>
                  Revisa los productos, controla el inventario y consulta
                  los pedidos de tu negocio.
                </p>
              </div>

              <div className="admin-coffee-decoration">☕</div>
            </section>

            <section className="admin-stats">
              <article className="admin-stat-card">
                <div className="admin-stat-icon">☕</div>
                <p>Productos registrados</p>
                <h2>{totalProductos}</h2>
                <small>En el listado actual</small>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-icon">▤</div>
                <p>Pedidos de ejemplo</p>
                <h2>{pedidos.length}</h2>
                <small>Datos demostrativos</small>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-icon">◉</div>
                <p>Unidades en inventario</p>
                <h2>{stockTotal}</h2>
                <small>Suma del stock registrado</small>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-icon">＄</div>
                <p>Total de pedidos de ejemplo</p>
                <h2>{formatoPrecio(ventasEjemplo)}</h2>
                <small>No corresponde a ventas reales</small>
              </article>
            </section>

            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Productos del catálogo</h2>
                  <p>Vista rápida de los productos registrados.</p>
                </div>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => setSeccion("productos")}
                >
                  + Gestionar productos
                </button>
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Stock</th>
                    </tr>
                  </thead>

                  <tbody>
                    {productos.slice(0, 5).map((producto) => (
                      <tr key={producto.id}>
                        <td>
                          <strong>{producto.nombre}</strong>
                        </td>

                        <td>{producto.categoria}</td>
                        <td>{formatoPrecio(producto.precio)}</td>

                        <td>
                          <span
                            className={
                              producto.stock <= 5
                                ? "admin-stock low"
                                : "admin-stock"
                            }
                          >
                            {producto.stock} unidades
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {seccion === "productos" && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>Catálogo de productos</h2>
                <p>
                  Agrega productos de cafetería y pastelería al listado.
                </p>
              </div>
            </div>

            <form
              className="admin-product-form"
              onSubmit={agregarProducto}
            >
              <label>
                Nombre del producto
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej. Torta de chocolate"
                  required
                />
              </label>

              <label>
                Categoría
                <select
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                >
                  <option value="Cafetería">Cafetería</option>
                  <option value="Pastelería">Pastelería</option>
                </select>
              </label>

              <label>
                Precio en pesos
                <input
                  type="number"
                  min="1"
                  value={nuevoPrecio}
                  onChange={(e) => setNuevoPrecio(e.target.value)}
                  placeholder="2990"
                  required
                />
              </label>

              <label>
                Stock
                <input
                  type="number"
                  min="0"
                  value={nuevoStock}
                  onChange={(e) => setNuevoStock(e.target.value)}
                  placeholder="10"
                  required
                />
              </label>

              <button
                className="admin-primary-button"
                type="submit"
              >
                + Agregar producto
              </button>
            </form>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id}>
                      <td>
                        <strong>{producto.nombre}</strong>
                      </td>

                      <td>{producto.categoria}</td>
                      <td>{formatoPrecio(producto.precio)}</td>
                      <td>{producto.stock}</td>

                      <td>
                        <button
                          type="button"
                          className="admin-delete-button"
                          onClick={() => eliminarProducto(producto.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="admin-note">
              Importante: estos cambios son temporales y se pierden al
              recargar la página. Todavía no se guardan en el backend.
            </p>
          </section>
        )}

        {seccion === "pedidos" && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>Pedidos recientes</h2>
                <p>Ejemplos visuales de pedidos de Coffee Flower.</p>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>N.º pedido</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {pedidos.map((pedido) => (
                    <tr key={pedido.id}>
                      <td>#{pedido.id}</td>
                      <td>{pedido.cliente}</td>
                      <td>{formatoPrecio(pedido.total)}</td>

                      <td>
                        <span className="admin-status">
                          {pedido.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="admin-note">
              Los pedidos son demostrativos. Se deben conectar al backend
              para mostrar los pedidos reales.
            </p>
          </section>
        )}

        {seccion === "informes" && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>Informes del negocio</h2>
                <p>
                  Consulta los datos demostrativos disponibles en este
                  panel.
                </p>
              </div>
            </div>

            <div className="admin-report-card">
              <div className="admin-report-icon">▥</div>

              <div>
                <h3>Resumen del inventario</h3>
                <p>
                  {totalProductos} productos registrados y {stockTotal}{" "}
                  unidades sumadas en el listado actual.
                </p>
              </div>

              <button
                type="button"
                className="admin-primary-button"
                onClick={() => window.print()}
              >
                Imprimir / Guardar PDF
              </button>
            </div>

            <p className="admin-note">
              El informe utiliza los datos que están en pantalla. Para
              informes reales de ventas y compras, se necesita conectar
              los endpoints correspondientes del backend.
            </p>
          </section>
        )}

        <footer className="admin-footer">
          <span>☕ Coffee Flower</span>
          <span>Panel de administración</span>
        </footer>
      </main>
    </div>
  );
}
