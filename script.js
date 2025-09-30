window.addEventListener("DOMContentLoaded", () => {
  const app = new CatalogoApp();
  app.iniciar();
});

class CatalogoApp {
  constructor() {
    this.productos = [];
    this.carrito = [];
    this.puntosTotales = 0;
    this.logoEmpresa = "logo.png";
    this.apiURL = "https://script.google.com/macros/s/AKfycbydkL54v0RSMbAh39RRDG97DOc6ASuB7UvZl3UDQoUdH55fG-063o7pcTTRlrhbgEJK2A/exec"; // 👈 Pega aquí la URL del Apps Script publicado
  }

  async iniciar() {
    document.getElementById("logoEmpresa").src = this.logoEmpresa;
    this.configurarModoOscuro();
    await this.cargarProductosDesdeSheet();
    this.renderizarProductos();
    this.configurarBuscador();
    this.configurarBotonCompra();
  }

  async cargarProductosDesdeSheet() {
    try {
      const resp = await fetch(this.apiURL);
      const data = await resp.json();
      this.productos = data.map(p => ({
        id: String(p.id),
        nombre: p.nombre,
        imagen: p.imagen,
        precio: Number(p.precio),
        stock: Number(p.stock),
      }));
    } catch (error) {
      console.error("Error cargando productos:", error);
    }
  }

  configurarModoOscuro() {
    const botonModoOscuro = document.getElementById("modoOscuroToggle");
    if (localStorage.getItem("modoOscuro") === "true") {
      this.modoOscuro = true;
      document.documentElement.classList.add("dark-mode");
    }
    botonModoOscuro.addEventListener("click", () => {
      this.modoOscuro = !this.modoOscuro;
      document.documentElement.classList.toggle("dark-mode");
      localStorage.setItem("modoOscuro", this.modoOscuro);
    });
  }

  configurarBuscador() {
    const buscador = document.getElementById("buscador");
    const resultadosBusqueda = document.getElementById("resultadosBusqueda");

    buscador.addEventListener("input", (e) => {
      const termino = e.target.value.toLowerCase().trim();
      if (termino === "") {
        resultadosBusqueda.innerHTML = "";
        return;
      }
      const resultados = this.productos.filter((producto) =>
        producto.nombre.toLowerCase().includes(termino)
      );
      this.mostrarResultadosBusqueda(resultados);
    });
  }

  mostrarResultadosBusqueda(resultados) {
    const resultadosBusqueda = document.getElementById("resultadosBusqueda");
    resultadosBusqueda.innerHTML = "";
    if (resultados.length === 0) {
      resultadosBusqueda.innerHTML = "<p>No se encontraron productos.</p>";
      return;
    }
    resultados.forEach((producto) => {
      const div = document.createElement("div");
      div.classList.add("resultado-busqueda");
      div.innerHTML = `
        <img src="${producto.imagen}" alt="${producto.nombre}">
        <h3>${producto.nombre}</h3>
        <p>Precio: $${producto.precio}</p>
        <button class="btn-agregar" data-id="${producto.id}" ${producto.stock === 0 ? "disabled" : ""}>
          ${producto.stock === 0 ? "Sin stock" : "Agregar al Carrito"}
        </button>
      `;
      resultadosBusqueda.appendChild(div);
    });
    this.asignarEventosAgregar();
  }

  renderizarProductos() {
    const contenedorCatalogo = document.getElementById("catalogo");
    contenedorCatalogo.innerHTML = "";
    this.productos.forEach((producto) => {
      const divProducto = document.createElement("div");
      divProducto.classList.add("producto");
      const nombreProducto =
        producto.stock === 0 ? "Sin stock" : producto.nombre;
      divProducto.innerHTML = `
        <img src="${producto.imagen}" alt="${producto.nombre}">
        <h3>${nombreProducto}</h3>
        <p>Precio: $${producto.precio}</p>
        <p>Stock: ${producto.stock}</p>
        <button class="btn-agregar" data-id="${producto.id}" ${producto.stock === 0 ? "disabled" : ""}>
          ${producto.stock === 0 ? "Sin stock" : "Agregar al Carrito"}
        </button>
      `;
      if (producto.stock === 0) divProducto.classList.add("sin-stock");
      contenedorCatalogo.appendChild(divProducto);
    });
    this.asignarEventosAgregar();
  }

  asignarEventosAgregar() {
    const botonesAgregar = document.querySelectorAll(".btn-agregar");
    botonesAgregar.forEach((boton) => {
      boton.addEventListener("click", (e) => {
        const productoId = e.target.dataset.id;
        this.agregarAlCarrito(productoId);
      });
    });
  }

  agregarAlCarrito(productoId) {
    const producto = this.productos.find((p) => p.id === productoId);
    if (!producto || producto.stock === 0) return;
    producto.stock--;
    this.carrito.push(producto);
    this.puntosTotales += producto.precio / 1000;
    this.renderizarProductos();
    this.actualizarCarrito();
  }

  quitarDelCarrito(productoId) {
    const productoIndex = this.carrito.findIndex((p) => p.id === productoId);
    if (productoIndex !== -1) {
      const producto = this.carrito.splice(productoIndex, 1)[0];
      this.puntosTotales -= producto.precio / 1000;
      const productoEnCatalogo = this.productos.find((p) => p.id === producto.id);
      if (productoEnCatalogo) productoEnCatalogo.stock++;
      this.actualizarCarrito();
      this.renderizarProductos();
    }
  }

  actualizarCarrito() {
    const listaCarrito = document.getElementById("listaCarrito");
    const totalCompra = document.getElementById("totalCompra");
    const puntosTotales = document.getElementById("puntosTotales");
    listaCarrito.innerHTML = "";
    let total = 0;
    this.carrito.forEach((item) => {
      const li = document.createElement("li");
      const infoProducto = document.createElement("span");
      infoProducto.textContent = `${item.nombre} - $${item.precio}`;
      const btnEliminar = document.createElement("button");
      btnEliminar.classList.add("btn-eliminar");
      btnEliminar.textContent = "×";
      btnEliminar.addEventListener("click", () => {
        this.quitarDelCarrito(item.id);
      });
      li.appendChild(infoProducto);
      li.appendChild(btnEliminar);
      listaCarrito.appendChild(li);
      total += item.precio;
    });
    totalCompra.textContent = total;
    puntosTotales.textContent = this.puntosTotales.toFixed(0);
  }

  configurarBotonCompra() {
    const botonCompra = document.getElementById("botonCompra");
    botonCompra.addEventListener("click", async () => {
      if (this.carrito.length === 0) {
        alert("Tu carrito está vacío.");
        return;
      }
      const nombreComprador = prompt("Por favor, ingrese su nombre:");
      if (!nombreComprador) {
        alert("El nombre es obligatorio.");
        return;
      }
      // Actualizar stock en Google Sheets
      const itemsComprados = this.carrito.reduce((acc, item) => {
        const existente = acc.find((i) => i.id === item.id);
        if (existente) {
          existente.cantidad++;
        } else {
          acc.push({ id: item.id, cantidad: 1 });
        }
        return acc;
      }, []);
      try {
        await fetch(this.apiURL, {
          method: "POST",
          body: JSON.stringify(itemsComprados),
          headers: { "Content-Type": "application/json" },
        });
        alert("Compra realizada con éxito. Gracias " + nombreComprador + "!");
        this.carrito = [];
        this.puntosTotales = 0;
        await this.cargarProductosDesdeSheet();
        this.renderizarProductos();
        this.actualizarCarrito();
      } catch (error) {
        console.error("Error al procesar compra:", error);
        alert("Error al registrar la compra.");
      }
    });
  }
}

