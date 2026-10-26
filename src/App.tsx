
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "react-oidc-context";

import Home from "./pages/Home";
import Productos, { type Product } from "./pages/Productos";
import Categorias from "./pages/Categorias";
import Cart from "./pages/Cart";

const API_URL = (
  import.meta.env.VITE_API_URL as string | undefined
)?.replace(/\/$/, "") ?? "";

const REDIRECT_URI = "https://coffee-flower-frontend.vercel.app/";
const COGNITO_DOMAIN =
  "https://us-east-1qhhxge8jy.auth.us-east-1.amazoncognito.com";
const COGNITO_CLIENT_ID = "3g344v2pmve6jr3vvua4k71cla";

type Page = "inicio" | "productos" | "categorias" | "carrito";

const DEMO_PRODUCTS: Product[] = [
  {
    id: 1,
    nombre: "Latte Vainilla",
    descripcion: "Espresso, leche cremosa y un toque de vainilla.",
    precio: 3490,
    categoria: "Café",
    emoji: "☕",
  },
  {
    id: 2,
    nombre: "Cappuccino",
    descripcion: "Espresso intenso con espuma de leche.",
    precio: 2990,
    categoria: "Café",
    emoji: "🥛",
  },
  {
    id: 3,
    nombre: "Croissant de mantequilla",
    descripcion: "Hojaldre dorado, horneado cada mañana.",
    precio: 2290,
    categoria: "Pastelería",
    emoji: "🥐",
  },
  {
    id: 4,
    nombre: "Torta de chocolate",
    descripcion: "Bizcocho húmedo con ganache de chocolate.",
    precio: 3990,
    categoria: "Pastelería",
    emoji: "🍰",
  },
  {
    id: 5,
    nombre: "Cold Brew",
    descripcion: "Café de extracción lenta, suave y refrescante.",
    precio: 3290,
    categoria: "Café",
    emoji: "🧋",
  },
  {
    id: 6,
    nombre: "Roll de canela",
    descripcion: "Masa suave, canela y glaseado delicado.",
    precio: 2590,
    categoria: "Pastelería",
    emoji: "🥮",
  },
];

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
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [category, setCategory] = useState("Todos");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOrder, setSendingOrder] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const groups =
    (auth.user?.profile?.["cognito:groups"] as string[] | undefined) ?? [];

  const role =
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

  const authHeaders = useCallback((): HeadersInit => {
    const token = auth.user?.access_token;

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [auth.user]);

  // Cargar catálogo desde API Gateway.
  useEffect(() => {
    if (!API_URL) {
      setMessage(
        "Falta configurar VITE_API_URL. Se muestran productos de demostración."
      );
      return;
    }

    let cancelled = false;

    async function cargarProductos() {
      setLoading(true);

      try {
        const response = await fetch(`${API_URL}/api/productos`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: Product[] = await response.json();

        if (!cancelled && Array.isArray(data) && data.length > 0) {
          const productosPreparados = data.map((product) => {
            const categoria = obtenerCategoria(product);

            return {
              ...product,
              categoria,
              emoji: obtenerEmoji(product, categoria),
            };
          });

          setProducts(productosPreparados);
          setMessage("");
        } else if (!cancelled && Array.isArray(data) && data.length === 0) {
          setProducts([]);
          setMessage("Todavía no hay productos registrados en el catálogo.");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error al cargar productos:", error);

          setMessage(
            `No se pudo cargar el catálogo. Se muestran productos de demostración. ${
              error instanceof Error ? error.message : ""
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

  // Iniciar sesión con Cognito.
  const login = () => {
    setMessage("");

    void auth.signinRedirect().catch((error) => {
      console.error("Error al iniciar sesión:", error);
      setMessage("No se pudo iniciar sesión. Revisa la configuración de Cognito.");
    });
  };

  // Cerrar sesión local y salir de la sesión administrada de Cognito.
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
      setMessage("No se pudo cerrar la sesión. Inténtalo nuevamente.");
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
    setActivePage(page);
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Enviar pedido al backend.
  async function checkout() {
    if (!auth.isAuthenticated) {
      setMessage("Inicia sesión para continuar con tu pedido.");
      return;
    }

    if (!cartCount) {
      setMessage("Agrega productos al carrito primero.");
      return;
    }

    if (!API_URL) {
      setMessage("Configura VITE_API_URL para enviar pedidos al backend.");
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
            .filter((product) => (cart[String(product.id)] ?? 0) > 0)
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

  return (
    <div className="app">
      <header className="topbar">
        <a
          className="brand"
          href="#inicio"
          onClick={(event) => {
            event.preventDefault();
            abrirPagina("inicio");
          }}
        >
          <span className="brand-icon">☕</span>
          <span className="brand-name">Coffee Flower</span>
        </a>

        <nav aria-label="Navegación principal">
          <a
            href="#inicio"
            aria-current={activePage === "inicio" ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault();
              abrirPagina("inicio");
            }}
          >
            Inicio
          </a>

          <a
            href="#productos"
            aria-current={activePage === "productos" ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault();
              abrirProductos("Todos");
            }}
          >
            Productos
          </a>

          <a
            href="#categorias"
            aria-current={activePage === "categorias" ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault();
              abrirPagina("categorias");
            }}
          >
            Categorías
          </a>

          <a
            href="#carrito"
            aria-current={activePage === "carrito" ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault();
              abrirPagina("carrito");
            }}
          >
            Carrito ({cartCount})
          </a>
        </nav>

        <div className="account">
          {auth.isLoading ? (
            <span>Verificando…</span>
          ) : auth.isAuthenticated ? (
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

      {activePage === "inicio" && (
        <Home
          onViewProducts={() => abrirProductos("Todos")}
          onViewCategories={() => abrirPagina("categorias")}
          onSelectCategory={abrirProductos}
        />
      )}

      {activePage === "productos" && (
        <Productos
          products={products}
          category={category}
          onSelectCategory={setCategory}
          onAddToCart={add}
          loading={loading}
        />
      )}

      {activePage === "categorias" && (
        <Categorias onSelectCategory={abrirProductos} />
      )}

      {activePage === "carrito" && (
        <Cart
          products={products}
          cart={cart}
          onAdd={add}
          onRemove={remove}
          onCheckout={() => void checkout()}
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
            abrirPagina("inicio");
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
