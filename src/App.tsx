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

function normalizarCategoria(categoria: string): string {
  const value = categoria.toLowerCase().trim();

  if (value.includes("pastel") || value.includes("dulce")) {
    return "Pastelería";
  }

  if (value.includes("café") || value.includes("cafe")) {
    return "Café";
  }

  return categoria;
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

  const groups =
    (auth.user?.profile?.["cognito:groups"] as string[] | undefined) ?? [];

  const role =
    groups.includes("Administrador") || groups.includes("Admin")
      ? "Administrador"
      : groups.includes("Colaborador")
        ? "Colaborador"
        : "Cliente";

  const email = String(
    auth.user?.profile?.email ?? auth.user?.profile?.username ?? ""
  );

  const authHeaders = useCallback((): HeadersInit => {
    const token = auth.user?.access_token;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, [auth.user]);

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
          setProducts(
            data.map((product) => {
              const categoria = normalizarCategoria(product.categoria ?? "");
              return {
                ...product,
                categoria,
                emoji: product.emoji ?? (categoria === "Café" ? "☕" : "🍰"),
              };
            })
          );
          setMessage("");
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            `No se pudo cargar el catálogo de la API. Se muestran productos de demostración. ${
              error instanceof Error ? error.message : ""
            }`
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
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
      sum + (cart[String(product.id)] ?? 0) * Number(product.precio),
    0
  );

  const money = (amount: number) =>
    amount.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });

  const login = () => {
    void auth.signinRedirect({ redirect_uri: REDIRECT_URI }).catch(() => {
      setMessage("No se pudo iniciar sesión. Revisa la configuración de Cognito.");
    });
  };

  const logout = async () => {
    try {
      await auth.removeUser();
      window.location.assign(REDIRECT_URI);
    } catch {
      setMessage("No se pudo cerrar la sesión.");
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
      if ((next[key] ?? 0) > 1) next[key] -= 1;
      else delete next[key];
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

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setCart({});
      setMessage("¡Tu pedido se envió correctamente!");
    } catch (error) {
      setMessage(
        `No se pudo enviar el pedido: ${
          error instanceof Error ? error.message : "error de red"
        }. Revisa API Gateway, backend y CORS.`
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
              >
                Cerrar sesión
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
