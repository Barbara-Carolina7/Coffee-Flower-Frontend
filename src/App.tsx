
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";

import Home from "./pages/Home";
import Productos, { type Product } from "./pages/Productos";
import Categorias from "./pages/Categorias";
import Cart from "./pages/Cart";
import Dashboard from "./pages/Dashboard";
import Colaborador from "./pages/Colaborador";

const API_URL = (
  import.meta.env.VITE_API_URL as string | undefined
)?.replace(/\/$/, "") ?? "";

const REDIRECT_URI = "https://coffee-flower-frontend.vercel.app/";

const COGNITO_DOMAIN =
  "https://us-east-1qhhxge8jy.auth.us-east-1.amazoncognito.com";

const COGNITO_CLIENT_ID = "3g344v2pmve6jr3vvua4k71cla";

type Role = "Administrador" | "Colaborador" | "Cliente";

type Page =
  | "inicio"
  | "productos"
  | "categorias"
  | "carrito"
  | "dashboard"
  | "colaborador";

function obtenerCategoria(product: Product): string {
  const categoria = String(product.categoria ?? "")
    .toLowerCase()
    .trim();

  const nombre = String(product.nombre ?? "")
    .toLowerCase()
    .trim();

  const palabrasPasteleria = [
    "cheesecake",
    "torta",
    "zanahoria",
    "pie de limón",
    "pie de limon",
    "brownie",
    "muffin",
    "croissant",
    "roll de canela",
    "kuchen",
    "pastel",
    "galleta",
    "queque",
    "factura",
    "berlín",
    "berlin",
  ];

  if (
    categoria.includes("pastel") ||
    categoria.includes("dulce") ||
    categoria.includes("repostería") ||
    categoria.includes("reposteria") ||
    palabrasPasteleria.some((palabra) => nombre.includes(palabra))
  ) {
    return "Pastelería";
  }

  if (
    categoria.includes("café") ||
    categoria.includes("cafe") ||
    nombre.includes("espresso") ||
    nombre.includes("americano") ||
    nombre.includes("cappuccino") ||
    nombre.includes("latte") ||
    nombre.includes("mocha") ||
    nombre.includes("moka") ||
    nombre.includes("frappé") ||
    nombre.includes("frappe") ||
    nombre.includes("cold brew") ||
    nombre.includes("chocolate caliente")
  ) {
    return "Café";
  }

  return product.categoria?.trim() || "Café";
}

function obtenerEmoji(product: Product, categoria: string): string {
  if (product.emoji?.trim()) {
    return product.emoji;
  }

  return categoria === "Café" ? "☕" : "🍰";
}

export default function App() {
  const auth = useAuth();

  const [activePage, setActivePage] = useState<Page>("inicio");
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState("Todos");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingOrder, setSendingOrder] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Obtener los grupos del usuario autenticado en Cognito.
  const groupsValue = auth.user?.profile?.["cognito:groups"];

  const groups: string[] = Array.isArray(groupsValue)
    ? groupsValue.filter(
        (group): group is string => typeof group === "string"
      )
    : typeof groupsValue === "string"
      ? [groupsValue]
      : [];

  const role: Role =
    groups.includes("Administrador") || groups.includes("Admin")
      ? "Administrador"
      : groups.includes("Colaborador")
        ? "Colaborador"
        : "Cliente";

  const email = String(
    auth.user?.profile?.email ??
      auth.user?.profile?.username ??
      ""
  );

  // Redirigir al panel correspondiente según el rol.
  useEffect(() => {
    if (auth.isLoading) return;

    if (!auth.isAuthenticated) {
      setActivePage("inicio");
      return;
    }

    if (role === "Administrador") {
      setActivePage("dashboard");
    } else if (role === "Colaborador") {
      setActivePage("colaborador");
    } else {
      setActivePage("inicio");
    }
  }, [auth.isLoading, auth.isAuthenticated, role]);

  const authHeaders = useCallback((): HeadersInit => {
    const token = auth.user?.access_token;

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [auth.user]);

  // Cargar productos desde API Gateway.
  useEffect(() => {
    let cancelled = false;

    async function cargarProductos() {
      setLoading(true);

      if (!API_URL) {
        setProducts([]);
        setMessage(
          "Falta configurar VITE_API_URL en las variables de entorno."
        );
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/productos`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: Product[] = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "La respuesta del servidor no es una lista de productos."
          );
        }

        if (cancelled) return;

        const productosPreparados = data.map((product) => {
          const categoria = obtenerCategoria(product);

          return {
            ...product,
            categoria,
            emoji: obtenerEmoji(product, categoria),
          };
        });

        setProducts(productosPreparados);
        setMessage(
          productosPreparados.length === 0
            ? "Todavía no hay productos registrados en el catálogo."
            : ""
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Error al cargar productos:", error);
          setProducts([]);

          setMessage(
            `No se pudieron cargar los productos desde el servidor. ${
              error instanceof Error
                ? error.message
                : "Error de conexión."
            }`
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void cargarProductos();

    return () => {
      cancelled = true;
    };
  }, []);

  const cartCount = Object.values(cart).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  const total = products.reduce(
    (sum, product) =>
      sum +
      (cart[String(product.id)] ?? 0) * Number(product.precio),
    0
  );

  // Iniciar sesión mediante el proveedor OIDC configurado.
  const login = () => {
    setMessage("");

    void auth.signinRedirect().catch((error) => {
      console.error("Error al iniciar sesión:", error);
      setMessage(
        "No se pudo iniciar sesión. Revisa la configuración de Cognito."
      );
    });
  };

  // Cerrar sesión local y en Cognito.
  const logout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);
    setMessage("");

    try {
      await auth.removeUser();

      const logoutUrl = new URL(`${COGNITO_DOMAIN}/logout`);
      logoutUrl.searchParams.set("client_id", COGNITO_CLIENT_ID);
      logoutUrl.searchParams.set("logout_uri", REDIRECT_URI);

      window.location.assign(logoutUrl.toString());
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setLoggingOut(false);
      setMessage(
        "No se pudo cerrar la sesión. Inténtalo nuevamente."
      );
    }
  };

  const add = (id: string | number) => {
    setCart((previous) => ({
      ...previous,
      [String(id)]: (previous[String(id)] ?? 0) + 1,
    }));

    setMessage("");
  };

  const remove = (id: string | number) => {
    setCart((previous) => {
      const next = { ...previous };
      const key = String(id);

      if ((next[key] ?? 0) > 1) {
        next[key] -= 1;
      } else {
        delete next[key];
      }

      return next;
    });
  };

  const abrirProductos = (categoria = "Todos") => {
    setCategory(categoria);
    setActivePage("productos");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const abrirPagina = (page: Page) => {
    if (page === "dashboard" && role !== "Administrador") {
      setMessage(
        "No tienes permiso para acceder al panel de administración."
      );
      return;
    }

    if (page === "colaborador" && role !== "Colaborador") {
      setMessage(
        "No tienes permiso para acceder al panel de colaborador."
      );
      return;
    }

    setActivePage(page);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Enviar el pedido al backend.
  async function checkout() {
    if (!auth.isAuthenticated) {
      setMessage("Inicia sesión para continuar con tu pedido.");
      return;
    }

    if (role !== "Cliente") {
      setMessage(
        "La compra está disponible para cuentas de Cliente."
      );
      return;
    }

    if (!cartCount) {
      setMessage("Agrega productos al carrito primero.");
      return;
    }

    if (!API_URL) {
      setMessage(
        "Configura VITE_API_URL para enviar pedidos al backend."
      );
      return;
    }

    setSendingOrder(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/pedidos`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          cliente: email,
          items: products
            .filter(
              (product) => (cart[String(product.id)] ?? 0) > 0
            )
            .map((product) => ({
              productoId: product.id,
              nombre: product.nombre,
              cantidad: cart[String(product.id)],
              precio: product.precio,
            })),
          total,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setCart({});
      setMessage("¡Tu pedido se envió correctamente!");
    } catch (error) {
      console.error("Error al enviar pedido:", error);

      setMessage(
        `No se pudo enviar el pedido: ${
          error instanceof Error ? error.message : "error de red"
        }. Revisa la ruta del backend y API Gateway.`
      );
    } finally {
      setSendingOrder(false);
    }
  }

  if (auth.isLoading) {
    return (
      <div className="app">
        <main className="role-dashboard">
          <h2>☕ Coffee Flower</h2>
          <p>Verificando tu sesión...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <a
          className="brand"
          href="#inicio"
          onClick={(event) => {
            event.preventDefault();

            if (role === "Administrador") {
              abrirPagina("dashboard");
            } else if (role === "Colaborador") {
              abrirPagina("colaborador");
            } else {
              abrirPagina("inicio");
            }
          }}
        >
          <span className="brand-icon">☕</span>
          <span className="brand-name">Coffee Flower</span>
        </a>

        <nav aria-label="Navegación principal">
          {role === "Cliente" && (
            <>
              <a
                href="#inicio"
                aria-current={
                  activePage === "inicio" ? "page" : undefined
                }
                onClick={(event) => {
                  event.preventDefault();
                  abrirPagina("inicio");
                }}
              >
                Inicio
              </a>

              <a
                href="#productos"
                aria-current={
                  activePage === "productos" ? "page" : undefined
                }
                onClick={(event) => {
                  event.preventDefault();
                  abrirProductos("Todos");
                }}
              >
                Productos
              </a>

              <a
                href="#categorias"
                aria-current={
                  activePage === "categorias" ? "page" : undefined
                }
                onClick={(event) => {
                  event.preventDefault();
                  abrirPagina("categorias");
                }}
              >
                Categorías
              </a>

              <a
                href="#carrito"
                aria-current={
                  activePage === "carrito" ? "page" : undefined
                }
                onClick={(event) => {
                  event.preventDefault();
                  abrirPagina("carrito");
                }}
              >
                Carrito ({cartCount})
              </a>
            </>
          )}

          {role === "Administrador" && (
            <a
              href="#dashboard"
              aria-current={
                activePage === "dashboard" ? "page" : undefined
              }
              onClick={(event) => {
                event.preventDefault();
                abrirPagina("dashboard");
              }}
            >
              Panel de administración
            </a>
          )}

          {role === "Colaborador" && (
            <a
              href="#colaborador"
              aria-current={
                activePage === "colaborador" ? "page" : undefined
              }
              onClick={(event) => {
                event.preventDefault();
                abrirPagina("colaborador");
              }}
            >
              Panel de colaborador
            </a>
          )}
        </nav>

        <div className="account">
          {auth.isAuthenticated ? (
            <>
              <span className="role">{role}</span>

              <button
                type="button"
                className="button button-outline"
                onClick={() => void logout()}
                disabled={loggingOut}
              >
                {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="button button-dark"
              onClick={login}
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </header>

      {role === "Cliente" && activePage === "inicio" && (
        <Home
          onViewProducts={() => abrirProductos("Todos")}
          onViewCategories={() => abrirPagina("categorias")}
          onSelectCategory={abrirProductos}
        />
      )}

      {role === "Cliente" && activePage === "productos" && (
        <Productos
          products={products}
          category={category}
          onSelectCategory={setCategory}
          onAddToCart={add}
          loading={loading}
        />
      )}

      {role === "Cliente" && activePage === "categorias" && (
        <Categorias onSelectCategory={abrirProductos} />
      )}

      {role === "Cliente" && activePage === "carrito" && (
        <Cart
          products={products}
          cart={cart}
          onAdd={add}
          onRemove={remove}
          onCheckout={() => void checkout()}
        />
      )}

      {role === "Administrador" && activePage === "dashboard" && (
        <Dashboard
          email={email}
          onBack={() => abrirPagina("inicio")}
        />
      )}

      {role === "Colaborador" && activePage === "colaborador" && (
        <Colaborador
          email={email}
          onBack={() => abrirPagina("inicio")}
        />
      )}

      {message && (
        <div className="notice" role="status">
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Cerrar mensaje"
          >
            ×
          </button>
        </div>
      )}

      {sendingOrder && (
        <div className="notice" role="status">
          Enviando tu pedido…
        </div>
      )}

      <footer>
        <a
          className="brand footer-brand"
          href="#inicio"
          onClick={(event) => {
            event.preventDefault();

            if (role === "Administrador") {
              abrirPagina("dashboard");
            } else if (role === "Colaborador") {
              abrirPagina("colaborador");
            } else {
              abrirPagina("inicio");
            }
          }}
        >
          <span className="brand-icon">☕</span>
          <span className="brand-name">Coffee Flower</span>
        </a>

        <span>Una pausa bonita, todos los días.</span>
        <span>© {new Date().getFullYear()} Coffee Flower</span>
      </footer>
    </div>
  );
}
