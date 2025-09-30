const API_URL = "https://script.google.com/macros/s/TU_ID_DE_WEBAPP/exec"; // reemplaza con tu URL de WebApp

window.addEventListener("DOMContentLoaded", () => { 
    const app = new CatalogoApp();
    app.iniciar();
});

class CatalogoApp {
    constructor() {
        this.productos = [];
        this.carrito = [];
        this.puntosTotales = 0;
        this.modoOscuro = false;
    }

    async iniciar() {
        await this.cargarProductosDesdeSheet();
        this.configurarModoOscuro();
        this.renderizarProductos();
        this.configurarBuscador();
        this.configurarBotonCompra();
    }

    async cargarProductosDesdeSheet() {
        try {
            const res = await fetch(API_URL);
            this.productos = await res.json();
        } catch (error) {
            console.error("Error cargando productos:", error);
        }
    }

    configurarModoOscuro() {
        const boton = document.getElementById('modoOscuroToggle');
        if (localStorage.getItem('modoOscuro') === 'true') {
            this.modoOscuro = true;
            document.documentElement.classList.add('dark-mode');
        }
        boton.addEventListener('click', () => {
            this.modoOscuro = !this.modoOscuro;
            document.documentElement.classList.toggle('dark-mode');
            localStorage.setItem('modoOscuro', this.modoOscuro);
        });
    }

    configurarBuscador() {
        const buscador = document.getElementById('buscador');
        const resultadosBusqueda = document.getElementById('resultadosBusqueda');
        buscador.addEventListener('input', e => {
            const termino = e.target.value.toLowerCase().trim();
            if (!termino) return resultadosBusqueda.innerHTML = '';
            const resultados = this.productos.filter(p => p.nombre.toLowerCase().includes(termino));
            this.mostrarResultadosBusqueda(resultados);
        });
    }

    mostrarResultadosBusqueda(resultados) {
        const resultadosBusqueda = document.getElementById('resultadosBusqueda');
        resultadosBusqueda.innerHTML = '';
        if (!resultados.length) return resultadosBusqueda.innerHTML = '<p>No se encontraron productos.</p>';
        resultados.forEach(p => {
            const div = document.createElement('div');
            div.className = 'resultado-busqueda';
            if (p.stock == 0) div.classList.add('sin-stock');
            div.innerHTML = `
                <img src="${p.imagen}" alt="${p.nombre}">
                <h3>${p.nombre}</h3>
                <p>Precio: $${p.precio}</p>
                <button class="btn-agregar" data-id="${p.id}" ${p.stock==0?'disabled':''}>
                    ${p.stock==0?'Sin stock':'Agregar al Carrito'}
                </button>
            `;
            resultadosBusqueda.appendChild(div);
        });

        document.querySelectorAll('.btn-agregar').forEach(boton => {
            boton.addEventListener('click', e => this.agregarAlCarrito(e.target.dataset.id));
        });
    }

    renderizarProductos() {
        const contenedor = document.getElementById('catalogo');
        contenedor.innerHTML = '';
        this.productos.forEach(p => {
            const div = document.createElement('div');
            div.className = 'producto';
            if (p.stock == 0) div.classList.add('sin-stock');
            div.innerHTML = `
                <img src="${p.imagen}" alt="${p.nombre}">
                <h3>${p.stock==0?'Sin stock':p.nombre}</h3>
                <p>Precio: $${p.precio}</p>
                <p>Stock: ${p.stock}</p>
                <button class="btn-agregar" data-id="${p.id}" ${p.stock==0?'disabled':''}>
                    ${p.stock==0?'Sin stock':'Agregar al Carrito'}
                </button>
            `;
            contenedor.appendChild(div);
        });

        document.querySelectorAll('.btn-agregar').forEach(boton => {
            boton.addEventListener('click', e => this.agregarAlCarrito(e.target.dataset.id));
        });
    }

    agregarAlCarrito(productoId) {
        const producto = this.productos.find(p => p.id == productoId);
        if (!producto || producto.stock == 0) return;
        producto.stock--;
        this.carrito.push(producto);
        this.puntosTotales += producto.precio / 1000;
        this.actualizarCarrito();
        this.renderizarProductos();
    }

    quitarDelCarrito(productoId) {
        const index = this.carrito.findIndex(p => p.id == productoId);
        if (index != -1) {
            const prod = this.carrito.splice(index,1)[0];
            this.puntosTotales -= prod.precio/1000;
            const prodCatalogo = this.productos.find(p=>p.id==prod.id);
            if (prodCatalogo) prodCatalogo.stock++;
            this.actualizarCarrito();
            this.renderizarProductos();
        }
    }

    actualizarCarrito() {
        const lista = document.getElementById('listaCarrito');
        const totalElem = document.getElementById('totalCompra');
        const puntosElem = document.getElementById('puntosTotales');
        lista.innerHTML='';
        let total=0;
        this.carrito.forEach(item=>{
            const li=document.createElement('li');
            const info=document.createElement('span');
            info.textContent=`${item.nombre} - $${item.precio}`;
            const btn=document.createElement('button');
            btn.className='btn-eliminar';
            btn.textContent='×';
            btn.addEventListener('click',()=>this.quitarDelCarrito(item.id));
            li.appendChild(info);
            li.appendChild(btn);
            lista.appendChild(li);
            total+=item.precio;
        });
        totalElem.textContent=total;
        puntosElem.textContent=this.puntosTotales.toFixed(0);
    }

    configurarBotonCompra() {
        const btn = document.getElementById('botonCompra');
        btn.addEventListener('click', ()=>{
            const nombre = prompt('Por favor, ingrese su nombre:');
            if(!nombre){ alert('El nombre es obligatorio.'); return; }
            const detalles = this.carrito.map(i=>`- ${i.nombre}, Precio: $${i.precio}`).join('\n');
            const total = this.carrito.reduce((t,i)=>t+i.precio,0);
            const puntos = this.puntosTotales.toFixed(0);
            const contenido=`Nombre: ${nombre}\nProductos:\n${detalles}\nTotal: $${total}\nPuntos: ${puntos}`;
            const blob = new Blob([contenido],{type:'text/plain'});
            const link=document.createElement('a');
            link.href=URL.createObjectURL(blob);
            link.download=`compra_${nombre}.txt`;
            link.click();
        });
    }
}
