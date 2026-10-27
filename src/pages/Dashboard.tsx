
import { useCallback, useEffect, useState } from "react";

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

type PedidoItem = {
  productoId?: number | string | null;
  nombre: string;
  cantidad: number;
  precio: number;
};

type Pedido = {
  id: number;
  cliente: string;
  items: PedidoItem[];
  total: number;
  estado: string;
  creadoEn: string | null;
};

type InformeRespuesta = {
  mensaje?: string;
  periodo?: string;
  cantidadPedidos?: number;
  unidadesVendidas?: number;
  totalVentas?: number | string;
  correoDestino?: string;
};

export default function Dashboard({ email, onBack }: DashboardProps) {
  const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

  const [seccion, setSeccion] = useState("resumen");

  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const [cargandoPedidos, setCargandoPedidos] = useState(false);
  const [errorPedidos, setErrorPedidos] = useState("");

  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [errorProductos, setErrorProductos] = useState("");

  const [enviandoInforme, setEnviandoInforme] = useState(false);
  const [mensajeInforme, setMensajeInforme] = useState("");
  const [errorInforme, setErrorInforme] = useState("");

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaCategoria, setNuevaCategoria] = useState("Cafetería");
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [nuevoStock, setNuevoStock] = useState("");

  const formatoPrecio = (precio: number) =>
    Number(precio || 0).toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });

  const cargarPedidos = useCallback(async () => {
    if (!API_URL) {
      setErrorPedidos("Falta configurar VITE_API_URL.");
      setPedidos([]);
      return;
    }

    setCargandoPedidos(true);
    setErrorPedidos("");

    try {
      const respuesta = await fetch(`${API_URL}/api/pedidos`);

      if (!respuesta.ok) {
        throw new Error(
          `No se pudieron consultar los pedidos. Código: ${respuesta.status}`
        );
      }

      const datos: unknown = await respuesta.json();

      if (!Array.isArray(datos)) {
        throw new Error("La respuesta del servidor no contiene una lista de pedidos.");
      }

      const pedidosNormalizados: Pedido[] = datos.map((dato) => {
        const p = dato as Record<string, unknown>;

        const items = Array.isArray(p.items)
          ? (p.items as Record<string, unknown>[]).map((item) => ({
              productoId: item.productoId as number | string | null | undefined,
              nombre: String(item.nombre ?? "Producto"),
              cantidad: Number(item.cantidad ?? 0),
              precio: Number(item.precio ?? 0),
            }))
          : [];

        return {
          id: Number(p.id),
          cliente: String(p.cliente ?? "Cliente"),
          items,
          total: Number(p.total ?? 0),
          estado: String(p.estado ?? "Pendiente"),
          creadoEn: p.creadoEn ? String(p.creadoEn) : null,
        };
      });

      setPedidos(pedidosNormalizados);
    } catch (error) {
      setPedidos([]);
      setErrorPedidos(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al cargar los pedidos."
      );
    } finally {
      setCargandoPedidos(false);
    }
  }, [API_URL]);

  const cargarProductos = useCallback(async () => {
    if (!API_URL) {
      setErrorProductos("Falta configurar VITE_API_URL.");
      setProductos([]);
      return;
    }

    setCargandoProductos(true);
    setErrorProductos("");

    try {
      const respuesta = await fetch(`${API_URL}/api/productos`);

      if (!respuesta.ok) {
        throw new Error(
          `No se pudieron consultar los productos. Código: ${respuesta.status}`
        );
      }

      const datos: unknown = await respuesta.json();

      if (!Array.isArray(datos)) {
        throw new Error("La respuesta del servidor no contiene una lista de productos.");
      }

      const productosNormalizados: Producto[] = datos.map((dato) => {
        const p = dato as Record<string, unknown>;

        return {
          id: Number(p.id),
          nombre: String(p.nombre ?? ""),
          categoria: String(p.categoria ?? "Sin categoría"),
          precio: Number(p.precio ?? 0),
          stock: Number(p.stock ?? 0),
        };
      });

      setProductos(productosNormalizados);
    } catch (error) {
      setProductos([]);
      setErrorProductos(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al cargar los productos."
      );
    } finally {
      setCargandoProductos(false);
    }
  }, [API_URL]);

  useEffect(() => {
    void cargarPedidos();
    void cargarProductos();
  }, [cargarPedidos, cargarProductos]);

  const agregarProducto = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (
      !nuevoNombre.trim() ||
      Number(nuevoPrecio) <= 0 ||
      nuevoStock === "" ||
      Number(nuevoStock) < 0
    ) {
      window.alert("Completa correctamente todos los campos.");
      return;
    }

    window.alert(
      "El formulario está preparado, pero debes conectar el endpoint POST de productos antes de guardar en la base de datos."
    );
  };

  const eliminarProducto = async (_id: number) => {
    window.alert(
      "Para eliminar productos de forma permanente, primero debemos conectar el endpoint DELETE del backend."
    );
  };

  const generarYEnviarInforme = async () => {
    if (!API_URL) {
      setErrorInforme("Falta configurar VITE_API_URL.");
      return;
    }

    setEnviandoInforme(true);
    setMensajeInforme("");
    setErrorInforme("");

    try {
      const respuesta = await fetch(`${API_URL}/api/reportes/compras`, {
        method: "POST",
      });

      const datos: InformeRespuesta = await respuesta
        .json()
        .catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje ||
            `No se pudo enviar el informe. Código: ${respuesta.status}`
        );
      }

      setMensajeInforme(
        [
          datos.mensaje || "Informe enviado correctamente.",
          datos.periodo ? `Periodo: ${datos.periodo}.` : "",
          `Pedidos: ${datos.cantidadPedidos ?? 0}.`,
          `Unidades vendidas: ${datos.unidadesVendidas ?? 0}.`,
          `Ventas: ${formatoPrecio(Number(datos.totalVentas ?? 0))}.`,
          datos.correoDestino ? `Correo: ${datos.correoDestino}.` : "",
        ]
          .filter(Boolean)
          .join(" ")
      );
    } catch (error) {
      setErrorInforme(
        error instanceof Error
          ? error.message
          : "No se pudo enviar el informe mensual."
      );
    } finally {
      setEnviandoInforme(false);
    }
  };

  const pedidosDelMes = pedidos.filter((pedido) => {
    if (!pedido.creadoEn) return false;

    const fecha = new Date(pedido.creadoEn);
    const ahora = new Date();

    return (
      !Number.isNaN(fecha.getTime()) &&
      fecha.getMonth() === ahora.getMonth() &&
      fecha.getFullYear() === ahora.getFullYear()
    );
  });

  const ventasDelMes = pedidosDelMes.reduce(
    (total, pedido) => total + pedido.total,
    0
  );

  const totalUnidadesMes = pedidosDelMes.reduce(
    (total, pedido) =>
      total +
      pedido.items.reduce(
        (suma, item) => suma + Number(item.cantidad || 0),
        0
      ),
    0
  );

  const totalProductos = productos.length;

  const stockTotal = productos.reduce(
    (total, producto) => total + producto.stock,
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
            <span>✉</span> Informes
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
                <h2>{cargandoProductos ? "…" : totalProductos}</h2>
                <small>Datos consultados del backend</small>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-icon">▤</div>
                <p>Pedidos del mes</p>
                <h2>{cargandoPedidos ? "…" : pedidosDelMes.length}</h2>
                <small>Pedidos registrados este mes</small>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-icon">◉</div>
                <p>Unidades vendidas</p>
                <h2>{cargandoPedidos ? "…" : totalUnidadesMes}</h2>
                <small>Unidades de los pedidos del mes</small>
              </article>

              <article className="admin-stat-card">
                <div className="admin-stat-icon">＄</div>
                <p>Ventas del mes</p>
                <h2>
                  {cargandoPedidos ? "…" : formatoPrecio(ventasDelMes)}
                </h2>
                <small>Total de los pedidos del mes</small>
              </article>
            </section>

            {(errorPedidos || errorProductos) && (
              <div className="admin-panel">
                {errorPedidos && (
                  <p className="admin-note" role="alert">
                    Pedidos: {errorPedidos}
                  </p>
                )}
                {errorProductos && (
                  <p className="admin-note" role="alert">
                    Productos: {errorProductos}
                  </p>
                )}
              </div>
            )}

            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Productos del catálogo</h2>
                  <p>Productos recibidos desde el backend.</p>
                </div>

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => setSeccion("productos")}
                >
                  Gestionar productos
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
                        <td><strong>{producto.nombre}</strong></td>
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

                    {!cargandoProductos && productos.length === 0 && (
                      <tr>
                        <td colSpan={4}>
                          No hay productos disponibles o no se pudieron cargar.
                        </td>
                      </tr>
                    )}
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
                <p>Productos cargados desde el backend.</p>
              </div>

              <button
                type="button"
                className="admin-primary-button"
                onClick={() => void cargarProductos()}
                disabled={cargandoProductos}
              >
                {cargandoProductos ? "Actualizando..." : "Actualizar catálogo"}
              </button>
            </div>

            {errorProductos && (
              <p className="admin-note" role="alert">{errorProductos}</p>
            )}

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

              <button className="admin-primary-button" type="submit">
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
                      <td><strong>{producto.nombre}</strong></td>
                      <td>{producto.categoria}</td>
                      <td>{formatoPrecio(producto.precio)}</td>
                      <td>{producto.stock}</td>
                      <td>
                        <button
                          type="button"
                          className="admin-delete-button"
                          onClick={() => void eliminarProducto(producto.id)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!cargandoProductos && productos.length === 0 && (
                    <tr>
                      <td colSpan={5}>No hay productos para mostrar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="admin-note">
              La consulta de productos está conectada. Para crear o eliminar
              productos de forma permanente, faltan los endpoints de escritura
              del backend.
            </p>
          </section>
        )}

        {seccion === "pedidos" && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>Pedidos registrados</h2>
                <p>Pedidos consultados desde el backend.</p>
              </div>

              <button
                type="button"
                className="admin-primary-button"
                onClick={() => void cargarPedidos()}
                disabled={cargandoPedidos}
              >
                {cargandoPedidos ? "Actualizando..." : "Actualizar pedidos"}
              </button>
            </div>

            {errorPedidos && (
              <p className="admin-note" role="alert">{errorPedidos}</p>
            )}

            {cargandoPedidos ? (
              <p className="admin-note">Cargando pedidos reales...</p>
            ) : (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>N.º pedido</th>
                      <th>Cliente</th>
                      <th>Productos</th>
                      <th>Total</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pedidos.map((pedido) => (
                      <tr key={pedido.id}>
                        <td>#{pedido.id}</td>
                        <td>{pedido.cliente}</td>
                        <td>
                          {pedido.items
                            .map((item) => `${item.nombre} × ${item.cantidad}`)
                            .join(", ") || "Sin detalle"}
                        </td>
                        <td>{formatoPrecio(pedido.total)}</td>
                        <td>
                          <span className="admin-status">
                            {pedido.estado}
                          </span>
                        </td>
                        <td>
                          {pedido.creadoEn
                            ? new Date(pedido.creadoEn).toLocaleString("es-CL")
                            : "Sin fecha"}
                        </td>
                      </tr>
                    ))}

                    {pedidos.length === 0 && !errorPedidos && (
                      <tr>
                        <td colSpan={6}>
                          No hay pedidos registrados en la base de datos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {seccion === "informes" && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>Informe mensual de ventas</h2>
                <p>
                  Envía el resumen de ventas al correo configurado del
                  administrador, sin PDF ni archivos adjuntos.
                </p>
              </div>
            </div>

            <div className="admin-report-card">
              <div className="admin-report-icon">✉</div>

              <div>
                <h3>Ventas del mes actual</h3>
                <p>
                  El backend calculará los pedidos, las unidades vendidas y
                  el total de ventas usando los registros de la base de datos.
                </p>
              </div>

              <button
                type="button"
                className="admin-primary-button"
                onClick={() => void generarYEnviarInforme()}
                disabled={enviandoInforme}
              >
                {enviandoInforme
                  ? "Enviando informe..."
                  : "Generar y enviar informe"}
              </button>
            </div>

            {mensajeInforme && (
              <p className="admin-note" role="status">
                {mensajeInforme}
              </p>
            )}

            {errorInforme && (
              <p className="admin-note" role="alert">
                {errorInforme}
              </p>
            )}
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
