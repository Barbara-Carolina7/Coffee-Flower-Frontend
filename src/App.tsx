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
    emoji: "🥮",
  },
];

export default function App() {
  const auth = useAuth();

  const [products, setProducts] =
    useState<Product[]>(DEMO_PRODUCTS);
  const [category, setCategory] = useState("Todos");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const groups =
    (auth.user?.profile?.["cognito:groups"] as
      | string[]
      | undefined) ?? [];

  const role = groups.includes("Administrador") ||
    groups.includes("Admin")
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
        const response = await fetch(
          `${API_URL}/api/productos`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: Product[] = await response.json();

        if (
          !cancelled &&
          Array.isArray(data) &&
          data.length > 0
        ) {
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
        : products.filter(
            (product) => product.categoria === category
          ),
    [products, category]
  );

  const cartCount = Object.values(cart).reduce(
    (sum, quantity) => sum + quantity,
    0
  );

  const total = products.reduce(
    (sum, product) =>
      sum +
      (cart[String(product.id)] ?? 0) * product.precio,
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
        "Falta configurar VITE_COGNITO_DOMAIN o VITE_COGNITO_CLIENT_ID en Vercel."
      );
      return;
    }

    if (auth.isLoading) {
      setMessage(
        "Espera un momento mientras se verifica tu sesión."
      );
      return;
    }

    void auth
      .signinRedirect({ redirect_uri: REDIRECT_URI })
      .catch(() => {
        setMessage(
          "No se pudo iniciar sesión. Revisa la configuración de Cognito."
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
      setMessage(
        "No se pudo cerrar la sesión correctamente."
      );
    }
  };

  const add = (id: string | number) => {
    setCart((previous) => ({
      ...previous,
      [String(id)]:
        (previous[String(id)] ?? 0) + 1,
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
      setMessage(
        "Inicia sesión para continuar con tu pedido."
      );
      return;
    }

    if (!cartCount) {
      setMessage(
        "Agrega productos al carrito primero."
      );
      return;
    }

    if (!API_URL) {
      setMessage(
        "Falta configurar VITE_API_URL. El pedido todavía no se puede enviar al backend."
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/pedidos`,
        {
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
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setCart({});
      setMessage("¡Pedido enviado correctamente!");
    } catch (error) {
      setMessage(
        `No se pudo enviar el pedido: ${
          error instanceof Error
            ? error.message
            : "error de red"
        }. Revisa API Gateway, el backend y CORS.`
      );
    }
  }

  return (
    <div className="app">
      <div className="announcement">
        HORNEAMOS ALGO ESPECIAL PARA TI
        <span>✳</span>
        CAFÉ DE ESPECIALIDAD · PASTELERÍA ARTESANAL
      </div>

      <header className="topbar">
        <a
          className="brand"
          href="#inicio"
          aria-label="Coffee Flower inicio"
        >
          <span className="brand-icon">✿</span>
          <span className="brand-name">
            coffee flower
            <small>PASTRY · COFFEE HOUSE</small>
          </span>
        </a>

        <button
          className="mobile-toggle"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Abrir menú"
        >
          ☰
        </button>

        <nav className={mobileMenu ? "nav-open" : ""}>
          <a
            href="#menu"
            onClick={() => setMobileMenu(false)}
          >
            La carta
          </a>
          <a
            href="#nosotros"
            onClick={() => setMobileMenu(false)}
          >
            Nuestra historia
          </a>
          <a
            href="#pedido"
            onClick={() => setMobileMenu(false)}
          >
            Carrito <span className="cart-pill">{cartCount}</span>
          </a>
        </nav>

        <div className="account">
          {auth.isLoading ? (
            <span className="role">Verificando…</span>
          ) : auth.isAuthenticated ? (
            <>
              <span className="role">{role}</span>
              <button
                className="button button-outline"
                onClick={() => void logout()}
              >
                Salir ↗
              </button>
            </>
          ) : (
            <button
              className="button button-dark"
              onClick={login}
              disabled={auth.isLoading}
            >
              Mi cuenta ↗
            </button>
          )}
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="eyebrow-line" />
              UNA DULCE FORMA DE PAUSAR
            </span>

            <h1>
              Un capricho
              <br />
              que <em>florece</em>
              <br />
              en tu día.
            </h1>

            <p>
              Café con carácter, pastelería hecha con cariño
              y pequeños momentos que merecen disfrutarse sin
              prisa.
            </p>

            <div className="hero-actions">
              <a className="button button-light" href="#menu">
                Explorar la carta <span>↗</span>
              </a>
              <span className="hero-aside">
                Preparado cada día
                <br />
                con ingredientes ricos.
              </span>
            </div>

            <div className="hero-bottom-note">
              <span>01 / 03</span>
              <span className="note-rule" />
              COFFEE, CAKE & A LITTLE JOY
            </div>
          </div>

          <div className="hero-visual" aria-label="Café y pastelería">
            <div className="hero-photo-shape">
              <div className="photo-orbit orbit-one" />
              <div className="photo-orbit orbit-two" />
              <div className="hero-food">☕</div>
              <div className="hero-pastry">🥐</div>
              <div className="photo-label">
                BAKED
                <br />
                WITH LOVE
              </div>
            </div>

            <div className="vertical-label">
              COFFEE FLOWER · EST. WITH LOVE
            </div>

            <div className="hero-stamp">
              FRESH
              <br />
              <b>DAILY</b>
              <br />
              ✿
            </div>
          </div>

          <div className="hero-number">
            CF<span>—</span>01
          </div>
        </section>

        <section className="marquee" aria-label="Especialidades">
          <span>CAFÉ DE ESPECIALIDAD</span>
          <i>✳</i>
          <span>PASTELERÍA ARTESANAL</span>
          <i>✳</i>
          <span>HECHO CON CARIÑO</span>
          <i>✳</i>
          <span>CAFÉ DE ESPECIALIDAD</span>
        </section>

        <section className="menu-section" id="menu">
          <div className="menu-intro">
            <div>
              <span className="eyebrow">
                <span className="eyebrow-line" />
                HECHO PARA DISFRUTAR
              </span>
              <h2>
                Pequeñas cosas.
                <br />
                <em>Grandes antojos.</em>
              </h2>
            </div>

            <p>
              Tu próximo favorito está aquí. Elige algo rico
              y convierte cualquier momento en una ocasión
              especial.
            </p>
          </div>

          <div className="menu-toolbar">
            <div className="menu-tabs">
              {["Todos", "Café", "Pastelería"].map((item) => (
                <button
                  key={item}
                  className={
                    category === item ? "filter active" : "filter"
                  }
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <span className="catalog-count">
              {loading
                ? "ACTUALIZANDO CARTA…"
                : `${filtered.length.toString().padStart(2, "0")} DELICIAS EN LA CARTA`}
            </span>
          </div>

          {!API_URL && (
            <p className="demo-note">
              Carta de muestra · los productos reales aparecerán
              al conectar el backend.
            </p>
          )}

          <div className="products">
            {filtered.map((product, index) => (
              <article
                className={`product product-${index % 3}`}
                key={product.id}
              >
                <div className={`product-art art-${index % 4}`}>
                  <span className="product-index">
                    0{index + 1}
                  </span>
                  <span className="product-emoji">
                    {product.emoji}
                  </span>
                  <span className="product-category">
                    {product.categoria}
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
                  <div>
                    <h3>{product.nombre}</h3>
                    <p>{product.descripcion}</p>
                  </div>
                  <strong>{money(product.precio)}</strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="story" id="nosotros">
          <div className="story-art">
            <span>✿</span>
            <b>
              UN RINCÓN
              <br />
              PARA TI
            </b>
            <i>CF.</i>
          </div>

          <div className="story-copy">
            <span className="eyebrow">
              <span className="eyebrow-line" />
              DETRÁS DE CADA DETALLE
            </span>

            <h2>
              No es solo café.
              <br />
              <em>Es sentirte en casa.</em>
            </h2>

            <p>
              En Coffee Flower creemos en las pausas bonitas:
              una taza recién preparada, algo dulce para
              compartir y la alegría de regalarte un momento
              solo para ti.
            </p>

            <a href="#menu" className="text-link">
              Descubre nuestros favoritos <span>↗</span>
            </a>
          </div>

          <div className="story-quote">
            “<span>Los días saben mejor</span>
            <br />
            con algo dulce.”
          </div>
        </section>

        <section className="checkout" id="pedido">
          <div className="checkout-heading">
            <span className="eyebrow">
              <span className="eyebrow-line" />
              TU SELECCIÓN
            </span>

            <h2>
              La parte más
              <br />
              <em>deliciosa del día.</em>
            </h2>

            <p>
              {cartCount
                ? `${cartCount} producto(s) en tu carrito`
                : "Agrega tus favoritos y prepara tu próximo antojo."}
            </p>

            {cartCount > 0 && (
              <div className="cart-items">
                {products
                  .filter((product) => cart[String(product.id)])
                  .map((product) => (
                    <div
                      key={product.id}
                      className="cart-item"
                    >
                      <span>
                        {product.emoji} {product.nombre} ×{" "}
                        {cart[String(product.id)]}
                      </span>

                      <button
                        className="remove-item"
                        onClick={() => remove(product.id)}
                        aria-label={`Quitar una unidad de ${product.nombre}`}
                      >
                        −
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="checkout-card">
            <span className="checkout-label">
              RESUMEN DE TU PEDIDO
            </span>

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
              Continuar pedido <span>↗</span>
            </button>

            <small>Un pequeño gusto, una gran sonrisa.</small>
          </div>
        </section>

        {(auth.error || message) && (
          <div className="notice" role="status">
            <span>
              {message ||
                "No se pudo verificar la sesión. Intenta iniciar sesión nuevamente."}
            </span>
            <button
              onClick={() => setMessage("")}
              aria-label="Cerrar mensaje"
            >
              ×
            </button>
          </div>
        )}
      </main>

      <footer>
        <a className="brand footer-brand" href="#inicio">
          <span className="brand-icon">✿</span>
          <span className="brand-name">
            coffee flower
            <small>PASTRY · COFFEE HOUSE</small>
          </span>
        </a>

        <span>Una pausa bonita, todos los días.</span>
        <span>© {new Date().getFullYear()} Coffee Flower</span>
      </footer>
    </div>
  );
}