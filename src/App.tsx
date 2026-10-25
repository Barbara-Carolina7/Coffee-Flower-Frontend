
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "react-oidc-context";

type Product = {
  id: string | number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: "Café" | "Pastelería";
  emoji: string;
};

const API_URL = (
  import.meta.env.VITE_API_URL as string | undefined
)?.replace(/\/$/, "") ?? "";

const COGNITO_DOMAIN = (
  import.meta.env.VITE_COGNITO_DOMAIN as string | undefined
)?.replace(/\/$/, "");

const COGNITO_CLIENT_ID = import.meta.env
  .VITE_COGNITO_CLIENT_ID as string | undefined;

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
    emoji: "🍥",
  },
];

export default function App() {
  const auth = useAuth();

  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [category, setCategory] = useState("Todos");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const groups =
    (auth.user?.profile?.["cognito:groups"] as string[] | undefined) ?? [];

  const role = groups.includes("Administrador") || groups.includes("Admin")
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
          setProducts(data);
          setMessage("");
        }
      } catch {
        if (!cancelled) {
          setMessage(
            "Mostrando catálogo de demostración. Revisa VITE_API_URL y el endpoint /api/productos."
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
        : products.filter((p) => p.categoria === category),
    [products, category]
  );

  const cartCount = Object.values(cart).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  const total = products.reduce(
    (sum, p) => sum + (cart[String(p.id)] ?? 0) * p.precio,
    0
  );

  const money = (amount: number) =>
    amount.toLocaleString("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    });

  const login = () => {
    if (!COGNITO_DOMAIN || !COGNITO_CLIENT_ID) {
      setMessage(
        "Falta configurar VITE_COGNITO_DOMAIN o VITE_COGNITO_CLIENT_ID en las variables de entorno de Vercel."
      );
      return;
    }

    if (auth.isLoading) {
      setMessage("Espera un momento mientras se verifica tu sesión.");
      return;
    }

    void auth.signinRedirect({
      redirect_uri: REDIRECT_URI,
    }).catch(() => {
      setMessage(
        "No se pudo iniciar sesión. Revisa el App Client y las URL de Cognito."
      );
    });
  };

  const logout = async () => {
    try {
      await auth.removeUser();

      if (COGNITO_DOMAIN && COGNITO_CLIENT_ID) {
        const params = new URLSearchParams({
          client_id: COGNITO_CLIENT_ID,
          logout_uri: REDIRECT_URI,
        });

        window.location.assign(
          `${COGNITO_DOMAIN}/logout?${params.toString()}`
        );
      } else {
        window.location.assign(REDIRECT_URI);
      }
    } catch {
      setMessage("No se pudo cerrar la sesión correctamente.");
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
      setMessage(
        "Falta configurar VITE_API_URL. El pedido todavía no se puede enviar al backend."
      );
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/pedidos`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          cliente: email,
          items: products
            .filter((p) => cart[String(p.id)])
            .map((p) => ({
              productoId: p.id,
              nombre: p.nombre,
              cantidad: cart[String(p.id)],
              precio: p.precio,
            })),
          total,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setCart({});
      setMessage("¡Pedido enviado correctamente!");
    } catch (error) {
      setMessage(
        `No se pudo enviar el pedido: ${
          error instanceof Error ? error.message : "error de red"
        }. Revisa API Gateway, el backend y CORS.`
      );
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#inicio">
          <span className="brand-icon">✿</span>
          <span>
            Coffee <i>Flower</i>
            <small>CAFÉ · PASTELERÍA</small>
          </span>
        </a>

        <nav>
          <a href="#menu">Menú</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#pedido">Mi pedido ({cartCount})</a>
        </nav>

        <div className="account">
          {auth.isLoading ? (
            <span>Verificando sesión...</span>
          ) : auth.isAuthenticated ? (
            <>
              <span className="role">{role}</span>
              <button
                className="button button-outline"
                onClick={() => void logout()}
              >
                Salir
              </button>
            </>
          ) : (
            <button
              className="button button-dark"
              onClick={login}
              disabled={auth.isLoading}
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <span className="eyebrow">UN MOMENTO PARA TI</span>
            <h1>
              Pequeños placeres,
              <br />
              <em>grandes momentos.</em>
            </h1>
            <p>
              Café preparado con cariño y pastelería recién hecha para
              acompañar tus días.
            </p>
            <a className="button button-dark" href="#menu">
              Descubrir el menú <span>↗</span>
            </a>
            <div className="hero-note">
              <span>✦</span> Hecho con cariño, servido con aroma.
            </div>
          </div>

          <div className="hero-art">
            <div className="sun" />
            <div className="hero-sticker">
              FRESH
              <br />
              DAILY ✿
            </div>
            <div className="cup">☕</div>
            <div className="hero-caption">
              Tu pausa favorita
              <br />
              <b>comienza aquí.</b>
            </div>
          </div>
        </section>

        <section className="menu-section" id="menu">
          <div className="section-head">
            <div>
              <span className="eyebrow">NUESTROS FAVORITOS</span>
              <h2>Algo rico te espera</h2>
            </div>
            <p>
              Sabores que alegran el día,
              <br />
              una taza y un bocado a la vez.
            </p>
          </div>

          <div className="filters">
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

          {loading && (
            <p className="muted">Consultando el catálogo de Coffee Flower…</p>
          )}

          <div className="products">
            {filtered.map((p, index) => (
              <article className="product" key={p.id}>
                <div className={`product-art art-${index % 4}`}>
                  <span>{p.emoji}</span>
                  <small>{p.categoria}</small>
                </div>

                <div className="product-info">
                  <div>
                    <h3>{p.nombre}</h3>
                    <p>{p.descripcion}</p>
                  </div>

                  <div className="product-bottom">
                    <strong>{money(p.precio)}</strong>
                    <button
                      className="add"
                      onClick={() => add(p.id)}
                      aria-label={`Agregar ${p.nombre}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="story" id="nosotros">
          <div className="story-mark">✿</div>
          <div>
            <span className="eyebrow">NUESTRA ESENCIA</span>
            <h2>
              Un rincón cálido
              <br />
              <em>en medio de tu día.</em>
            </h2>
            <p>
              En Coffee Flower creemos que un buen café puede convertir un
              momento cotidiano en uno especial. Preparamos cada taza y cada
              dulce pensando en ti.
            </p>
          </div>
          <div className="story-stat">
            <strong>100%</strong>
            <span>
              amor por el café
              <br />y los detalles
            </span>
          </div>
        </section>

        <section className="checkout" id="pedido">
          <div>
            <span className="eyebrow">TU SELECCIÓN</span>
            <h2>Tu pausa, a tu manera.</h2>
            <p>
              {cartCount
                ? `${cartCount} producto(s) en tu carrito`
                : "Agrega tus favoritos del menú para comenzar."}
            </p>

            {cartCount > 0 && (
              <div className="cart-items">
                {products
                  .filter((p) => cart[String(p.id)])
                  .map((p) => (
                    <div key={p.id} className="cart-item">
                      <span>
                        {p.emoji} {p.nombre} × {cart[String(p.id)]}
                      </span>
                      <button
                        className="button button-outline"
                        onClick={() => remove(p.id)}
                        aria-label={`Quitar una unidad de ${p.nombre}`}
                      >
                        −
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="checkout-total">
            <span>Total estimado</span>
            <strong>{money(total)}</strong>
            <button
              className="button button-dark"
              onClick={() => void checkout()}
            >
              Continuar pedido ↗
            </button>
          </div>
        </section>

        {auth.error && (
          <div className="notice" role="alert">
            <span>
              No se pudo verificar la sesión. Intenta iniciar sesión
              nuevamente.
            </span>
          </div>
        )}

        {message && (
          <div className="notice" role="status">
            <span>{message}</span>
            <button onClick={() => setMessage("")} aria-label="Cerrar mensaje">
              ×
            </button>
          </div>
        )}
      </main>

      <footer>
        <a className="brand footer-brand" href="#inicio">
          <span className="brand-icon">✿</span>
          <span>
            Coffee <i>Flower</i>
            <small>CAFÉ · PASTELERÍA</small>
          </span>
        </a>
        <span>Una pausa bonita, todos los días.</span>
        <span>© {new Date().getFullYear()} Coffee Flower 360</span>
      </footer>
    </div>
  );
}
