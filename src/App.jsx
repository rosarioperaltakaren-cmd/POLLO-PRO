
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, db } from "./firebase/config";
import Clientes from "./components/Clientes";
import "./App.css";

const initialProducts = [
  { id: 1, name: "Pollo entero", category: "Pollos", price: 65, stock: 25, minStock: 5 },
  { id: 2, name: "Medio pollo", category: "Pollos", price: 35, stock: 30, minStock: 5 },
  { id: 3, name: "Cuarto de pollo", category: "Pollos", price: 20, stock: 40, minStock: 8 },
  { id: 4, name: "Octavo de pollo", category: "Pollos", price: 12, stock: 40, minStock: 8 },
  { id: 5, name: "Porción de papas", category: "Complementos", price: 8, stock: 50, minStock: 10 },
  { id: 6, name: "Ensalada", category: "Complementos", price: 6, stock: 35, minStock: 8 },
  { id: 7, name: "Inca Kola personal", category: "Bebidas", price: 4, stock: 40, minStock: 10 },
  { id: 8, name: "Gaseosa 1 litro", category: "Bebidas", price: 9, stock: 25, minStock: 5 },
  { id: 9, name: "Gaseosa 1.5 litros", category: "Bebidas", price: 12, stock: 20, minStock: 5 },
];

const money = (value) =>
  `S/ ${Number(value || 0).toFixed(2)}`;

const dateText = (value) => {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Sin fecha"
    : date.toLocaleString("es-PE");
};

function loadStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

const styles = {
  app: {
    minHeight: "100vh",
    display: "flex",
    background: "#f4f6fa",
    color: "#172033",
    fontFamily: "Arial, sans-serif",
  },
  sidebar: {
    width: 235,
    minWidth: 235,
    background: "#14243a",
    color: "#fff",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  logo: {
    fontSize: 25,
    fontWeight: 800,
    padding: "12px 5px 25px",
    color: "#ffbd59",
  },
  nav: {
    border: 0,
    borderRadius: 9,
    padding: "13px 14px",
    color: "#dce5f2",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
    fontSize: 14,
  },
  activeNav: {
    background: "#e97824",
    color: "#fff",
    fontWeight: 700,
  },
  main: {
    flex: 1,
    minWidth: 0,
    padding: 28,
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 15,
    flexWrap: "wrap",
    marginBottom: 25,
  },
  title: {
    fontSize: 27,
    margin: 0,
    color: "#172033",
  },
  muted: {
    color: "#718096",
    fontSize: 13,
  },
  card: {
    background: "#fff",
    borderRadius: 14,
    padding: 20,
    boxShadow: "0 3px 15px rgba(20,36,58,.06)",
    border: "1px solid #e9edf3",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
    gap: 16,
    marginBottom: 22,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #dce2ea",
    borderRadius: 8,
    padding: "11px 12px",
    fontSize: 14,
    background: "#fff",
    color: "#172033",
  },
  button: {
    border: 0,
    borderRadius: 8,
    background: "#e97824",
    color: "#fff",
    padding: "11px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondary: {
    border: "1px solid #dce2ea",
    borderRadius: 8,
    background: "#fff",
    color: "#26364b",
    padding: "10px 14px",
    cursor: "pointer",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  cell: {
    padding: "13px 10px",
    borderBottom: "1px solid #edf0f4",
    textAlign: "left",
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 7,
  },
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onLogin(email, password);
    } catch (err) {
      console.error(err);
      setError("No se pudo iniciar sesión. Verifica tu correo y contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
  
    <form
  className="login-card"
  onSubmit={submit}
  style={{
    ...styles.card,
    width: "100%",
    maxWidth: 390,
    boxSizing: "border-box",
    padding: 32,
  }}
>
      
        <div style={{ textAlign: "center", marginBottom: 25 }}>
          <div style={{ fontSize: 48 }}>🍗</div>
          <h1 style={{ color: "#14243a", margin: "8px 0" }}>POLLO PRO</h1>
          <p style={styles.muted}>Sistema de gestión de pollería</p>
        </div>

        <Field label="Correo electrónico">
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@ejemplo.com"
            required
          />
        </Field>

        <Field label="Contraseña">
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ingresa tu contraseña"
            required
          />
        </Field>

        {error && (
          <p style={{ color: "#c0392b", fontSize: 13 }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ ...styles.button, width: "100%", padding: 13 }}
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </form>
    </div>
  );
}

function PolleriaApp({ user, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [clients, setClients] = useState([]);
  const [cloudLoaded, setCloudLoaded] = useState(false);
  const [cloudError, setCloudError] = useState("");
  const [notice, setNotice] = useState("");

  const [cart, setCart] = useState([]);
  const [service, setService] = useState("Mesa");
  const [payment, setPayment] = useState("Efectivo");
  const [customer, setCustomer] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [table, setTable] = useState("");
  const [address, setAddress] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "Pollos",
    price: "",
    stock: "",
    minStock: "5",
  });

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todos");

  const userRoot = ["users", user.uid];
  const productsRef = collection(db, ...userRoot, "products");
  const salesRef = collection(db, ...userRoot, "sales");
  const clientsRef = collection(db, ...userRoot, "clientes");

  useEffect(() => {
    let active = true;

    async function loadData() {
      setCloudLoaded(false);
      setCloudError("");

      try {
        const migrationRef = doc(db, ...userRoot, "settings", "migration");
        const migrationSnap = await getDoc(migrationRef);

        if (!migrationSnap.exists()) {
          const [cloudProducts, cloudSales] = await Promise.all([
            getDocs(productsRef),
            getDocs(salesRef),
          ]);

          const localProducts = loadStorage("pollopro_products", initialProducts);
          const localSales = loadStorage("pollopro_sales", []);

          if (cloudProducts.empty) {
            for (const product of localProducts) {
              await setDoc(
                doc(productsRef, String(product.id)),
                product
              );
            }
          }

          if (cloudSales.empty) {
            for (const sale of localSales) {
              await setDoc(
                doc(salesRef, String(sale.id)),
                sale
              );
            }
          }

          await setDoc(migrationRef, {
            completedAt: new Date().toISOString(),
          });
        }

        let [productSnapshot, salesSnapshot] = await Promise.all([
          getDocs(productsRef),
          getDocs(salesRef),
        ]);

        if (productSnapshot.empty) {
          for (const product of initialProducts) {
            await setDoc(
              doc(productsRef, String(product.id)),
              product
            );
          }
          productSnapshot = await getDocs(productsRef);
        }

        const loadedProducts = productSnapshot.docs.map((item) => ({
          ...item.data(),
          id: item.data().id ?? item.id,
        }));

        const loadedSales = salesSnapshot.docs
          .map((item) => ({ ...item.data(), id: item.id }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        if (active) {
          setProducts(loadedProducts);
          setSales(loadedSales);
          setCloudLoaded(true);
        }
      } catch (error) {
        console.error("Error cargando Firebase:", error);
        if (active) {
          setCloudError(
            "No se pudieron cargar los datos. Revisa tu conexión y las reglas de Firestore."
          );
        }
      }
    }

    async function loadClients() {
      try {
        const snapshot = await getDocs(clientsRef);
        if (active) {
          setClients(snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })));
        }
      } catch (error) {
        console.error("Error cargando clientes:", error);
      }
    }

    loadData();
    loadClients();

    return () => {
      active = false;
    };
  }, [user.uid]);

  useEffect(() => {
    if (cloudLoaded) {
      localStorage.setItem("pollopro_products", JSON.stringify(products));
    }
  }, [products, cloudLoaded]);

  useEffect(() => {
    if (cloudLoaded) {
      localStorage.setItem("pollopro_sales", JSON.stringify(sales));
    }
  }, [sales, cloudLoaded]);

  const totalSales = useMemo(
    () => sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0),
    [sales]
  );

  const todaySales = useMemo(() => {
    const today = new Date().toDateString();
    return sales.filter(
      (sale) => sale.date && new Date(sale.date).toDateString() === today
    );
  }, [sales]);

  const todayTotal = todaySales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  );

  const lowStock = products.filter(
    (product) => Number(product.stock) <= Number(product.minStock)
  );

  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "Todos" || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }

  function addToCart(product) {
    if (Number(product.stock) <= 0) {
      showNotice("Este producto no tiene stock disponible.");
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) {
          showNotice("No hay suficiente stock.");
          return current;
        }

        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  function changeQuantity(id, amount) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  async function finishSale() {
    if (!cart.length) {
      showNotice("Agrega productos al carrito.");
      return;
    }

    if (service === "Mesa" && !table.trim()) {
      showNotice("Ingresa el número de mesa.");
      return;
    }

    if (service === "Delivery" && !address.trim()) {
      showNotice("Ingresa la dirección de delivery.");
      return;
    }

    const saleRef = doc(salesRef);
    const saleId = saleRef.id;

    const sale = {
      id: saleId,
      date: new Date().toISOString(),
      customer: customer.trim() || "Cliente general",
      customerId: selectedClientId || null,
      service,
      payment,
      table: service === "Mesa" ? table : "",
      address: service === "Delivery" ? address : "",
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        subtotal: Number(item.price) * Number(item.quantity),
      })),
      total: cartTotal,
      status: "Pendiente",
    };

    try {
      await runTransaction(db, async (transaction) => {
        const productSnapshots = [];

        for (const item of cart) {
          const productRef = doc(productsRef, String(item.id));
          const snapshot = await transaction.get(productRef);

          if (!snapshot.exists()) {
            throw new Error(`No se encontró ${item.name}.`);
          }

          const currentStock = Number(snapshot.data().stock || 0);

          if (currentStock < item.quantity) {
            throw new Error(`Stock insuficiente para ${item.name}.`);
          }

          productSnapshots.push({
            ref: productRef,
            stock: currentStock,
            quantity: item.quantity,
          });
        }

        for (const item of productSnapshots) {
          transaction.update(item.ref, {
            stock: item.stock - item.quantity,
          });
        }

        transaction.set(saleRef, sale);
      });

      setSales((current) => [sale, ...current]);
      setProducts((current) =>
        current.map((product) => {
          const sold = cart.find((item) => item.id === product.id);
          return sold
            ? { ...product, stock: Number(product.stock) - sold.quantity }
            : product;
        })
      );

      setCart([]);
      setCustomer("");
      setSelectedClientId("");
      setTable("");
      setAddress("");
      showNotice("¡Venta registrada correctamente!");
    } catch (error) {
      console.error("Error registrando venta:", error);
      showNotice(error.message || "No se pudo registrar la venta.");
    }
  }

  function resetProductForm() {
    setEditingId(null);
    setProductForm({
      name: "",
      category: "Pollos",
      price: "",
      stock: "",
      minStock: "5",
    });
  }

  async function saveProduct(event) {
    event.preventDefault();

    const name = productForm.name.trim();
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);
    const minStock = Number(productForm.minStock);

    if (!name || !Number.isFinite(price) || price <= 0 ||
        !Number.isFinite(stock) || stock < 0) {
      showNotice("Completa correctamente los datos del producto.");
      return;
    }

    const id = editingId ?? Date.now();
    const product = {
      id,
      name,
      category: productForm.category,
      price,
      stock,
      minStock: Number.isFinite(minStock) ? minStock : 5,
    };

    try {
      await setDoc(doc(productsRef, String(id)), product);
      setProducts((current) =>
        editingId
          ? current.map((item) => item.id === editingId ? product : item)
          : [...current, product]
      );
      resetProductForm();
      showNotice("Producto guardado correctamente.");
    } catch (error) {
      console.error(error);
      showNotice("No se pudo guardar el producto en Firebase.");
    }
  }

  function editProduct(product) {
    setEditingId(product.id);
    setProductForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      minStock: String(product.minStock ?? 5),
    });
    setPage("products");
  }

  async function deleteProduct(product) {
    if (!window.confirm(`¿Deseas eliminar ${product.name}?`)) return;

    try {
      await deleteDoc(doc(productsRef, String(product.id)));
      setProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );
      showNotice("Producto eliminado.");
    } catch (error) {
      console.error(error);
      showNotice("No se pudo eliminar el producto.");
    }
  }

  async function updateSaleStatus(sale, status) {
    try {
      await updateDoc(doc(salesRef, String(sale.id)), { status });
      setSales((current) =>
        current.map((item) =>
          item.id === sale.id ? { ...item, status } : item
        )
      );
      showNotice("Estado del pedido actualizado.");
    } catch (error) {
      console.error(error);
      showNotice("No se pudo actualizar el pedido.");
    }
  }

  function exportSales() {
    const rows = [
      ["Fecha", "Cliente", "Servicio", "Pago", "Total", "Estado"],
      ...sales.map((sale) => [
        dateText(sale.date),
        sale.customer || "Cliente general",
        sale.service || "",
        sale.payment || "",
        sale.total || 0,
        sale.status || "",
      ]),
    ];

    const csv = rows
      .map((row) =>
        row.map((value) =>
          `"${String(value).replaceAll('"', '""')}"`
        ).join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reporte-ventas-pollo-pro.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const navigation = [
    ["dashboard", "📊", "Dashboard"],
    ["pos", "🛒", "Punto de venta"],
    ["kitchen", "🍳", "Cocina"],
    ["sales", "🧾", "Ventas"],
    ["products", "📦", "Productos"],
    ["clientes", "👥", "Clientes"],
    ["reports", "📈", "Reportes"],
  ];

  const pageTitles = {
    dashboard: "Dashboard",
    pos: "Punto de venta",
    kitchen: "Cocina",
    sales: "Historial de ventas",
    products: "Gestión de productos",
    clientes: "Gestión de clientes",
    reports: "Reportes",
  };

  function renderDashboard() {
    return (
      <>
        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.muted}>Ventas de hoy</div>
            <h2>{money(todayTotal)}</h2>
            <span style={styles.muted}>{todaySales.length} ventas registradas</span>
          </div>
          <div style={styles.card}>
            <div style={styles.muted}>Ventas acumuladas</div>
            <h2>{money(totalSales)}</h2>
            <span style={styles.muted}>{sales.length} operaciones</span>
          </div>
          <div style={styles.card}>
            <div style={styles.muted}>Productos registrados</div>
            <h2>{products.length}</h2>
            <span style={styles.muted}>En el inventario</span>
          </div>
          <div style={styles.card}>
            <div style={styles.muted}>Stock bajo</div>
            <h2 style={{ color: lowStock.length ? "#d35400" : "#218c55" }}>
              {lowStock.length}
            </h2>
            <span style={styles.muted}>Productos por reponer</span>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.top}>
            <div>
              <h3 style={{ margin: 0 }}>Ventas recientes</h3>
              <p style={styles.muted}>Últimas operaciones registradas</p>
            </div>
            <button style={styles.secondary} onClick={() => setPage("sales")}>
              Ver todas
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Fecha", "Cliente", "Servicio", "Total", "Estado"].map((heading) => (
                    <th key={heading} style={styles.cell}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 6).map((sale) => (
                  <tr key={sale.id}>
                    <td style={styles.cell}>{dateText(sale.date)}</td>
                    <td style={styles.cell}>{sale.customer || "Cliente general"}</td>
                    <td style={styles.cell}>{sale.service}</td>
                    <td style={styles.cell}>{money(sale.total)}</td>
                    <td style={styles.cell}>{sale.status || "Pendiente"}</td>
                  </tr>
                ))}
                {!sales.length && (
                  <tr><td style={styles.cell} colSpan="5">Todavía no hay ventas registradas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {lowStock.length > 0 && (
          <div style={{ ...styles.card, marginTop: 18 }}>
            <h3>⚠️ Productos con stock bajo</h3>
            {lowStock.map((product) => (
              <p key={product.id}>
                {product.name}: {product.stock} unidades disponibles
              </p>
            ))}
          </div>
        )}
      </>
    );
  }

  function renderPOS() {
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1.5fr) minmax(290px,1fr)",
        gap: 18,
        alignItems: "start",
      }}>
        <div style={styles.card}>
          <div style={styles.top}>
            <input
              style={{ ...styles.input, maxWidth: 260 }}
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              style={{ ...styles.input, maxWidth: 180 }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {["Todos", "Pollos", "Complementos", "Bebidas"].map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))",
            gap: 12,
          }}>
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={Number(product.stock) <= 0}
                style={{
                  ...styles.card,
                  cursor: product.stock > 0 ? "pointer" : "not-allowed",
                  textAlign: "left",
                  padding: 15,
                  opacity: product.stock > 0 ? 1 : .55,
                }}
              >
                <div style={{ fontSize: 27 }}>🍗</div>
                <strong>{product.name}</strong>
                <p style={{ margin: "8px 0", color: "#e97824", fontWeight: 800 }}>
                  {money(product.price)}
                </p>
                <small style={styles.muted}>Stock: {product.stock}</small>
              </button>
            ))}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>🛒 Pedido actual</h3>

          {cart.length === 0 && (
            <p style={styles.muted}>Selecciona productos para comenzar.</p>
          )}

          {cart.map((item) => (
            <div key={item.id} style={{
              padding: "12px 0",
              borderBottom: "1px solid #edf0f4",
            }}>
              <strong>{item.name}</strong>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
              }}>
                <div>
                  <button style={styles.secondary} onClick={() => changeQuantity(item.id, -1)}>−</button>
                  <strong style={{ margin: "0 10px" }}>{item.quantity}</strong>
                  <button
                    style={styles.secondary}
                    onClick={() => changeQuantity(item.id, 1)}
                    disabled={item.quantity >= item.stock}
                  >+</button>
                </div>
                <strong>{money(item.price * item.quantity)}</strong>
                <button
                  style={{ ...styles.secondary, color: "#c0392b" }}
                  onClick={() => removeFromCart(item.id)}
                >✕</button>
              </div>
            </div>
          ))}

          <h2 style={{ textAlign: "right" }}>Total: {money(cartTotal)}</h2>

          <Field label="Tipo de servicio">
            <select style={styles.input} value={service} onChange={(e) => setService(e.target.value)}>
              <option>Mesa</option>
              <option>Para llevar</option>
              <option>Delivery</option>
            </select>
          </Field>

          {service === "Mesa" && (
            <Field label="Número de mesa">
              <input style={styles.input} value={table} onChange={(e) => setTable(e.target.value)} placeholder="Ej. 5" />
            </Field>
          )}

          {service === "Delivery" && (
            <Field label="Dirección de entrega">
              <input style={styles.input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección del cliente" />
            </Field>
          )}

          <Field label="Cliente registrado">
            <select
              style={styles.input}
              value={selectedClientId}
              onChange={(e) => {
                const id = e.target.value;
                const selected = clients.find((item) => item.id === id);
                setSelectedClientId(id);
                setCustomer(selected?.nombre || selected?.name || "");
                if (selected?.direccion || selected?.address) {
                  setAddress(selected.direccion || selected.address);
                }
              }}
            >
              <option value="">Cliente general / seleccionar</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nombre || client.name || client.telefono || client.id}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Nombre del cliente">
            <input style={styles.input} value={customer} onChange={(e) => setCustomer(e.target.value)} placeholder="Nombre del cliente" />
          </Field>

          <Field label="Método de pago">
            <select style={styles.input} value={payment} onChange={(e) => setPayment(e.target.value)}>
              <option>Efectivo</option>
              <option>Yape</option>
              <option>Plin</option>
              <option>Tarjeta</option>
            </select>
          </Field>

          <button
            style={{ ...styles.button, width: "100%", padding: 14 }}
            onClick={finishSale}
            disabled={!cart.length}
          >
            Registrar venta · {money(cartTotal)}
          </button>
        </div>
      </div>
    );
  }

  function renderProducts() {
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(260px,.8fr) minmax(0,1.5fr)",
        gap: 18,
        alignItems: "start",
      }}>
        <form style={styles.card} onSubmit={saveProduct}>
          <h3>{editingId ? "Editar producto" : "Nuevo producto"}</h3>

          <Field label="Nombre">
            <input style={styles.input} value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
          </Field>

          <Field label="Categoría">
            <select style={styles.input} value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}>
              <option>Pollos</option>
              <option>Complementos</option>
              <option>Bebidas</option>
            </select>
          </Field>

          <Field label="Precio (S/)">
            <input style={styles.input} type="number" min="0.01" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} required />
          </Field>

          <Field label="Stock">
            <input style={styles.input} type="number" min="0" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} required />
          </Field>

          <Field label="Stock mínimo">
            <input style={styles.input} type="number" min="0" value={productForm.minStock} onChange={(e) => setProductForm({ ...productForm, minStock: e.target.value })} />
          </Field>

          <div style={{ display: "flex", gap: 8 }}>
            <button style={styles.button} type="submit">
              {editingId ? "Guardar cambios" : "Agregar producto"}
            </button>
            {editingId && (
              <button style={styles.secondary} type="button" onClick={resetProductForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div style={styles.card}>
          <h3>Inventario de productos</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Producto", "Categoría", "Precio", "Stock", "Acciones"].map((heading) => (
                    <th key={heading} style={styles.cell}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td style={styles.cell}>{product.name}</td>
                    <td style={styles.cell}>{product.category}</td>
                    <td style={styles.cell}>{money(product.price)}</td>
                    <td style={styles.cell}>
                      <span style={{ color: product.stock <= product.minStock ? "#d35400" : "#218c55" }}>
                        {product.stock}
                      </span>
                    </td>
                    <td style={styles.cell}>
                      <button style={styles.secondary} onClick={() => editProduct(product)}>Editar</button>{" "}
                      <button style={{ ...styles.secondary, color: "#c0392b" }} onClick={() => deleteProduct(product)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  function renderSales() {
    return (
      <div style={styles.card}>
        <div style={styles.top}>
          <div>
            <h3 style={{ margin: 0 }}>Historial de ventas</h3>
            <p style={styles.muted}>Todas las ventas registradas en el sistema</p>
          </div>
          <button style={styles.button} onClick={exportSales}>Exportar CSV</button>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Fecha", "Cliente", "Servicio", "Pago", "Total", "Estado"].map((heading) => (
                  <th key={heading} style={styles.cell}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td style={styles.cell}>{dateText(sale.date)}</td>
                  <td style={styles.cell}>{sale.customer}</td>
                  <td style={styles.cell}>{sale.service}</td>
                  <td style={styles.cell}>{sale.payment}</td>
                  <td style={styles.cell}>{money(sale.total)}</td>
                  <td style={styles.cell}>{sale.status || "Pendiente"}</td>
                </tr>
              ))}
              {!sales.length && (
                <tr><td style={styles.cell} colSpan="6">No hay ventas registradas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderKitchen() {
    const orders = sales.filter((sale) =>
      !["Entregado", "Cancelado"].includes(sale.status)
    );

    return (
      <div style={styles.grid}>
        {orders.map((sale) => (
          <div style={styles.card} key={sale.id}>
            <div style={styles.top}>
              <strong>Pedido #{String(sale.id).slice(-6)}</strong>
              <span style={styles.muted}>{dateText(sale.date)}</span>
            </div>
            <h3>{sale.customer || "Cliente general"}</h3>
            <p style={styles.muted}>
              {sale.service} {sale.table ? `· Mesa ${sale.table}` : ""}
            </p>
            {(sale.items || []).map((item, index) => (
              <p key={index}>
                {item.quantity} × {item.name}
              </p>
            ))}
            <strong>Total: {money(sale.total)}</strong>
            <Field label="Estado del pedido">
              <select
                style={styles.input}
                value={sale.status || "Pendiente"}
                onChange={(e) => updateSaleStatus(sale, e.target.value)}
              >
                <option>Pendiente</option>
                <option>En preparación</option>
                <option>Listo</option>
                <option>Entregado</option>
                <option>Cancelado</option>
              </select>
            </Field>
          </div>
        ))}
        {!orders.length && (
          <div style={styles.card}>No hay pedidos pendientes.</div>
        )}
      </div>
    );
  }

  function renderReports() {
    const paymentTotals = sales.reduce((result, sale) => {
      const key = sale.payment || "No especificado";
      result[key] = (result[key] || 0) + Number(sale.total || 0);
      return result;
    }, {});

    return (
      <>
        <div style={styles.grid}>
          <div style={styles.card}>
            <p style={styles.muted}>Ingresos totales</p>
            <h2>{money(totalSales)}</h2>
          </div>
          <div style={styles.card}>
            <p style={styles.muted}>Cantidad de ventas</p>
            <h2>{sales.length}</h2>
          </div>
          <div style={styles.card}>
            <p style={styles.muted}>Promedio por venta</p>
            <h2>{money(sales.length ? totalSales / sales.length : 0)}</h2>
          </div>
        </div>

        <div style={styles.card}>
          <h3>Ventas por método de pago</h3>
          {Object.entries(paymentTotals).map(([method, total]) => (
            <div key={method} style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 12,
              borderBottom: "1px solid #edf0f4",
            }}>
              <span>{method}</span>
              <strong>{money(total)}</strong>
            </div>
          ))}
          {!Object.keys(paymentTotals).length && (
            <p style={styles.muted}>Todavía no hay datos para mostrar.</p>
          )}
          <button style={{ ...styles.button, marginTop: 18 }} onClick={exportSales}>
            Descargar reporte
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="app-shell" style={styles.app}>
     <aside className="app-sidebar" style={styles.sidebar}>
        <div className="brand-logo" style={styles.logo}>
  🍗 POLLO PRO
</div>
        <div style={{ color: "#aebdd0", fontSize: 12, padding: "0 8px 10px" }}>
          MENÚ PRINCIPAL
        </div>

        {navigation.map(([id, icon, label]) => (
         <button
  key={id}
  className={page === id ? "active" : ""}
            style={{
              ...styles.nav,
              ...(page === id ? styles.activeNav : {}),
            }}
            onClick={() => setPage(id)}
          >
            {icon} &nbsp; {label}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <div style={{
          padding: 12,
          background: "rgba(255,255,255,.08)",
          borderRadius: 9,
          fontSize: 12,
          overflowWrap: "anywhere",
        }}>
          Sesión iniciada
          <p style={{ margin: "6px 0 0", color: "#ffbd59" }}>{user.email}</p>
        </div>

        <button
          style={{ ...styles.nav, marginTop: 8 }}
          onClick={onLogout}
        >
          ↪ Cerrar sesión
        </button>
      </aside>

     <main className="app-main" style={styles.main}>
       <header className="app-header" style={styles.top}>
          <div>
            <h1 style={styles.title}>{pageTitles[page]}</h1>
            <p style={styles.muted}>Bienvenido al sistema de gestión POLLO PRO</p>
          </div>
          <div style={{ ...styles.card, padding: "10px 15px" }}>
            <span style={styles.muted}>Fecha: </span>
            <strong>{new Date().toLocaleDateString("es-PE")}</strong>
          </div>
        </header>

        {!cloudLoaded && !cloudError && (
          <div style={styles.card}>Cargando información desde Firebase...</div>
        )}

        {cloudError && (
          <div style={{
            ...styles.card,
            color: "#b42318",
            marginBottom: 18,
          }}>
            {cloudError}
          </div>
        )}

        {notice && (
          <div style={{
            ...styles.card,
            marginBottom: 18,
            borderLeft: "4px solid #e97824",
          }}>
            {notice}
          </div>
        )}

        {cloudLoaded && (
          <>
            {page === "dashboard" && renderDashboard()}
            {page === "pos" && renderPOS()}
            {page === "kitchen" && renderKitchen()}
            {page === "sales" && renderSales()}
            {page === "products" && renderProducts()}
            {page === "clientes" && (
              <div style={styles.card}>
                <Clientes />
              </div>
            )}
            {page === "reports" && renderReports()}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  async function handleLogin(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function handleLogout() {
    await signOut(auth);
  }

  if (checkingAuth) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        fontFamily: "Arial, sans-serif",
      }}>
        Cargando POLLO PRO...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return <PolleriaApp user={user} onLogout={handleLogout} />;
}