
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../firebase/config";
import "./Clientes.css";

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState("");

  const formularioInicial = {
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
  };

  const [formulario, setFormulario] = useState(formularioInicial);

  const obtenerClientes = async () => {
    const usuario = auth.currentUser;

    if (!usuario) {
      setError("Inicia sesión para consultar los clientes.");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError("");

      const referencia = collection(
        db,
        "users",
        usuario.uid,
        "clientes"
      );

      const resultado = await getDocs(referencia);

      const lista = resultado.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));

      setClientes(
        lista.sort((a, b) =>
          (a.nombre || "").localeCompare(b.nombre || "")
        )
      );
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los clientes.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerClientes();
  }, []);

  const clientesFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return clientes.filter((cliente) =>
      [
        cliente.nombre,
        cliente.telefono,
        cliente.email,
      ].some((dato) =>
        String(dato || "").toLowerCase().includes(termino)
      )
    );
  }, [clientes, busqueda]);

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));
  };

  const guardarCliente = async (evento) => {
    evento.preventDefault();

    const usuario = auth.currentUser;

    if (!usuario) {
      setError("Tu sesión ha expirado. Vuelve a iniciar sesión.");
      return;
    }

    if (!formulario.nombre.trim()) {
      setError("Escribe el nombre del cliente.");
      return;
    }

    if (!formulario.telefono.trim()) {
      setError("Escribe el teléfono del cliente.");
      return;
    }

    try {
      setGuardando(true);
      setError("");

      const referencia = collection(
        db,
        "users",
        usuario.uid,
        "clientes"
      );

      const datos = {
        nombre: formulario.nombre.trim(),
        telefono: formulario.telefono.trim(),
        email: formulario.email.trim(),
        direccion: formulario.direccion.trim(),
        actualizadoEn: serverTimestamp(),
      };

      if (editando) {
        await updateDoc(
          doc(db, "users", usuario.uid, "clientes", editando),
          datos
        );
      } else {
        await addDoc(referencia, {
          ...datos,
          creadoEn: serverTimestamp(),
        });
      }

      setFormulario(formularioInicial);
      setEditando(null);

      await obtenerClientes();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el cliente. Revisa Firebase.");
    } finally {
      setGuardando(false);
    }
  };

  const editarCliente = (cliente) => {
    setEditando(cliente.id);

    setFormulario({
      nombre: cliente.nombre || "",
      telefono: cliente.telefono || "",
      email: cliente.email || "",
      direccion: cliente.direccion || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const eliminarCliente = async (id) => {
    const usuario = auth.currentUser;

    if (!usuario) return;

    const confirmar = window.confirm(
      "¿Estás seguro de eliminar este cliente?"
    );

    if (!confirmar) return;

    try {
      setError("");

      await deleteDoc(
        doc(db, "users", usuario.uid, "clientes", id)
      );

      await obtenerClientes();
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar el cliente.");
    }
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setFormulario(formularioInicial);
    setError("");
  };

  return (
    <section className="clientes-page">
      <div className="clientes-encabezado">
        <div>
          <span className="clientes-etiqueta">GESTIÓN COMERCIAL</span>
          <h2>Clientes</h2>
          <p>Administra la información de tus clientes.</p>
        </div>

        <div className="clientes-total">
          <span>Total de clientes</span>
          <strong>{clientes.length}</strong>
        </div>
      </div>

      {error && (
        <div className="clientes-error" role="alert">
          {error}
        </div>
      )}

      <div className="clientes-panel">
        <div className="clientes-panel-titulo">
          <h3>{editando ? "Editar cliente" : "Registrar cliente"}</h3>
          <span>Completa los datos del cliente</span>
        </div>

        <form onSubmit={guardarCliente} className="clientes-formulario">
          <label>
            Nombre completo *
            <input
              name="nombre"
              value={formulario.nombre}
              onChange={cambiarCampo}
              placeholder="Ej. Juan Pérez"
              maxLength={100}
              required
            />
          </label>

          <label>
            Teléfono *
            <input
              name="telefono"
              value={formulario.telefono}
              onChange={cambiarCampo}
              placeholder="Ej. 987654321"
              maxLength={20}
              required
            />
          </label>

          <label>
            Correo electrónico
            <input
              name="email"
              type="email"
              value={formulario.email}
              onChange={cambiarCampo}
              placeholder="cliente@correo.com"
              maxLength={120}
            />
          </label>

          <label>
            Dirección
            <input
              name="direccion"
              value={formulario.direccion}
              onChange={cambiarCampo}
              placeholder="Dirección del cliente"
              maxLength={200}
            />
          </label>

          <div className="clientes-acciones-formulario">
            <button
              type="submit"
              disabled={guardando}
              className="clientes-boton-principal"
            >
              {guardando
                ? "Guardando..."
                : editando
                  ? "Guardar cambios"
                  : "Registrar cliente"}
            </button>

            {editando && (
              <button
                type="button"
                onClick={cancelarEdicion}
                className="clientes-boton-secundario"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="clientes-panel">
        <div className="clientes-lista-encabezado">
          <div>
            <h3>Directorio de clientes</h3>
            <span>Consulta y administra tus registros</span>
          </div>

          <input
            className="clientes-busqueda"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar cliente..."
            aria-label="Buscar cliente"
          />
        </div>

        {cargando ? (
          <p className="clientes-vacio">Cargando clientes...</p>
        ) : clientesFiltrados.length === 0 ? (
          <p className="clientes-vacio">
            No hay clientes para mostrar.
          </p>
        ) : (
          <div className="clientes-tabla-contenedor">
            <table className="clientes-tabla">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Dirección</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>{cliente.nombre}</td>
                    <td>{cliente.telefono}</td>
                    <td>{cliente.email || "—"}</td>
                    <td>{cliente.direccion || "—"}</td>
                    <td>
                      <div className="clientes-botones-tabla">
                        <button
                          type="button"
                          onClick={() => editarCliente(cliente)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarCliente(cliente.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
