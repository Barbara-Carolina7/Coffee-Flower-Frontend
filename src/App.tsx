
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";

type Product = {
  id: string | number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  emoji?: string;
};

const API_URL = (
  import.meta.env.VITE_API_URL as string | undefined
)?.replace(/\/$/, "") ?? "";

const REDIRECT_URI = "https://coffee-flower-frontend.vercel.app/";

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

function normalizarCategoria(categoria: string) {
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

  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [category, setCategory] = useState("Todos");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (!API_URL) return;

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
            data.map((product) => ({
              ...product,
              categoria: normalizarCategoria(product.categoria),
              emoji:
                product.emoji ??
                (normalizarCategoria(product.categoria) === "Café"
                  ? "☕"
                  : "🍰"),
            }))
          );
        }
      } catch {
        if (!cancelled) {
          setMessage(
            "No se pudo cargar el catálogo del backend. Se muestran productos de demostración."
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

  const filtered = useMemo(
    () =>
      category === "Todos"
        ? products
        : products.filter(
            (product) =>
              normalizarCategoria(product.categoria) === category
          ),
    [products, category]
  );

  const cartCount = Object.values(cart).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  const total = products.reduce(
    (sum, product) =>
      sum + (cart[String(product.id)] ?? 0) * product.precio,
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
      setMessage("No se pudo iniciar sesión. Revisa Cognito.");
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

      if ((next[key] ?? 0) > 1) {
        next[key] -= 1;
      } else {
        delete next[key];
      }

      return next;
    });
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

    try {
      const response = await fetch(`${API_URL}/api/pedidos`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          cliente: email,
          items: products
            .filter((product) => cart[String(product.id)])
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
      setMessage(
        `No se pudo enviar el pedido: ${
          error instanceof Error ? error.message : "error de red"
        }. Revisa API Gateway, backend y CORS.`
      );
    }
  }

  const elegirCategoria = (value: string) => {
    setCategory(value);
    document.getElementById("menu")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#inicio">
          <span className="brand-icon">☕</span>
          <span className="brand-name">Coffee Flower</span>
        </a>

        <nav>
          <a href="#inicio">Inicio</a>
          <a href="#menu">Productos</a>
          <a href="#categorias">Categorías</a>
          <a href="#pedido">
            Carrito ({cartCount})
          </a>
        </nav>

        <div className="account">
          {auth.isLoading ? (
            <span>Verificando…</span>
          ) : auth.isAuthenticated ? (
            <>
              <span className="role">{role}</span>
              <button className="button button-outline" onClick={() => void logout()}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <button className="button button-dark" onClick={login}>
              Iniciar sesión
            </button>
          )}
        </div>
      </header>

      <main>
        {/* PORTADA ORIGINAL */}
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <span className="eyebrow">
              ☕ Bienvenido a Coffee Flower 🌸
            </span>

            <h1>
              El sabor que
              <br />
              <span>florece</span> en cada
              <br />
              taza
            </h1>

            <p>
              Descubre nuestros cafés, pasteles y productos preparados
              especialmente para acompañar tus mejores momentos.
            </p>

            <div className="hero-actions">
              <button
                className="button button-dark"
                onClick={() => elegirCategoria("Todos")}
              >
                Ver productos
              </button>

              <a className="button button-outline" href="#categorias">
                Ver categorías
              </a>
            </div>
          </div>

          <div className="hero-visual" aria-label="Café con flores">
            <div className="hero-circle">
              <span className="hero-cup">☕</span>
            </div>
            <span className="flower flower-one">🌸</span>
            <span className="flower flower-two">🌷</span>
          </div>
        </section>

        {/* SOLO LAS DOS CATEGORÍAS DESTACADAS */}
        <section className="featured-section" id="categorias">
          <div className="section-heading">
            <span className="eyebrow">NUESTROS FAVORITOS</span>
            <h2>Productos destacados</h2>
          </div>

          <div className="featured-grid">
            <button
              className="featured-card"
              onClick={() => elegirCategoria("Café")}
            >
              <span className="featured-icon">☕</span>
              <h3>Cafés</h3>
              <p>
                Cafés preparados con granos seleccionados para disfrutar
                cada momento.
              </p>
              <span className="featured-link">Ver productos →</span>
            </button>

            <button
              className="featured-card"
              onClick={() => elegirCategoria("Pastelería")}
            >
              <span className="featured-icon">🍰</span>
              <h3>Pastelería</h3>
              <p>
                Deliciosos acompañamientos para disfrutar junto a tu café.
              </p>
              <span className="featured-link">Ver productos →</span>
            </button>
          </div>
        </section>

        {/* CATÁLOGO FUNCIONAL */}
        <section className="menu-section" id="menu">
          <div className="menu-intro">
            <div>
              <span className="eyebrow">DESCUBRE TU FAVORITO</span>
              <h2>Nuestra carta</h2>
            </div>
            <p>Elige tus productos favoritos y agrégalos al carrito.</p>
          </div>

          <div className="menu-toolbar">
            <div className="menu-tabs">
              {["Todos", "Café", "Pastelería"].map((item) => (
                <button
                  key={item}
                  className={category === item ? "filter active" : "filter"}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <span className="catalog-count">
              {loading ? "CARGANDO…" : `${filtered.length} PRODUCTOS`}
            </span>
          </div>

          <div className="products">
            {filtered.map((product) => (
              <article className="product" key={product.id}>
                <div className="product-art">
                  <span className="product-emoji">
                    {product.emoji ??
                      (normalizarCategoria(product.categoria) === "Café"
                        ? "☕"
                        : "🍰")}
                  </span>
                  <span className="product-category">
                    {normalizarCategoria(product.categoria)}
                  </span>
                  <button
                    className="add"
                    onClick={() => add(product.id)}
                    aria-label={`Agregar ${product.nombre}`}
                  >
                    +
                  </button>
                </div>

                <div className="product-info">
                  <h3>{product.nombre}</h3>
                  <p>{product.descripcion}</p>
                  <div className="product-price">
                    <strong>{money(product.precio)}</strong>
                    <button
                      className="small-add"
                      onClick={() => add(product.id)}
                    >
                      Agregar +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CARRITO */}
        <section className="checkout" id="pedido">
          <div className="checkout-heading">
            <span className="eyebrow">TU SELECCIÓN</span>
            <h2>
              Tu pausa,
              <br />
              <em>a tu manera.</em>
            </h2>
            <p>
              {cartCount
                ? `${cartCount} producto(s) en tu carrito.`
                : "Agrega tus favoritos y prepara tu próximo antojo."}
            </p>

            {cartCount > 0 && (
              <div className="cart-items">
                {products
                  .filter((product) => cart[String(product.id)])
                  .map((product) => (
                    <div className="cart-item" key={product.id}>
                      <span>
                        {product.emoji ?? "☕"} {product.nombre} ×{" "}
                        {cart[String(product.id)]}
                      </span>
                      <button
                        className="remove-item"
                        onClick={() => remove(product.id)}
                      >
                        −
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="checkout-card">
            <span className="checkout-label">RESUMEN DE TU PEDIDO</span>
            <div className="checkout-row">
              <span>Productos</span>
              <strong>{cartCount}</strong>
            </div>
            <div className="checkout-row checkout-total">
              <span>Total estimado</span>
              <strong>{money(total)}</strong>
            </div>
            <button
              className="button button-dark checkout-button"
              onClick={() => void checkout()}
            >
              Continuar pedido ↗
            </button>
            <small>Un pequeño gusto, una gran sonrisa.</small>
          </div>
        </section>

        {message && (
          <div className="notice" role="status">
            <span>{message}</span>
            <button onClick={() => setMessage("")} aria-label="Cerrar">
              ×
            </button>
          </div>
        )}
      </main>

      <footer>
        <a className="brand footer-brand" href="#inicio">
          <span className="brand-icon">☕</span>
          <span className="brand-name">Coffee Flower</span>
        </a>
        <span>Una pausa bonita, todos los días.</span>
        <span>© {new Date().getFullYear()} Coffee Flower</span>
      </footer>
    </div>
  );
}
