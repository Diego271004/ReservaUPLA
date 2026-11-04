# Reutilización (Fase 7)

Objetivo: demostrar con medidas que ninguna pantalla repite código de campos, mensajes o manejo de errores, y que los componentes de `src/components/ui` se usan en las pantallas.

## 1. Duplicación antes y después

Medida con **jscpd 4.0.5** sobre `frontend/src` y `backend` (formatos JavaScript, JSX y C#; se excluyen `bin`, `obj`, `node_modules`, `dist`, CSS y todo el código de pruebas). Se ejecuta con `node tools/reutilizacion/medir-duplicacion.mjs <archivo> <antes|despues>`. Los informes completos, con la lista de bloques y archivos, están en:

- `docs/evidencias/fase7-duplicacion-antes.txt`
- `docs/evidencias/fase7-duplicacion-despues.txt`

jscpd con su umbral estándar (5 líneas y 50 tokens) da **0 %** antes y después: no encuentra copias grandes. Por eso se mide también con dos perfiles más sensibles. La **medida de referencia** es el perfil sensible (4 líneas y 30 tokens).

| Perfil | Antes | Después |
|---|---|---|
| **Sensible, 4 líneas / 30 tokens (referencia)** | **1,38 %** (87 líneas, 12 bloques) | **0,88 %** (55 líneas, 9 bloques) |
| Estándar de jscpd, 5 líneas / 50 tokens | 0,00 % (0 bloques) | 0,00 % (0 bloques) |
| Muy sensible, 3 líneas / 20 tokens | 6,17 % (390 líneas, 69 bloques) | 3,30 % (205 líneas, 42 bloques) |

Por formato en el perfil de referencia: JavaScript pasó de 0,65 % (1 bloque) a **0,00 %**, JSX se mantuvo en 0,00 % y C# bajó de 2,87 % a 2,10 %.

### Bloques eliminados (perfil de referencia)

| # | Dónde estaba la copia | Qué se hizo |
|---|---|---|
| 1 | `LoginPage.jsx` y `UsuarioFormPage.jsx`: 15 líneas de propiedades de campo (valor, error, `onChange`, `onBlur`, referencia, deshabilitado) | `useFormulario` entrega `campoDeTexto(nombre)` y `campoDeLista(nombre)`; las pantallas escriben `{...form.campoDeTexto('correo')}` |
| 2 | `ReservaService.cs`: 11 líneas repetidas entre aprobar, rechazar y cancelar (buscar, comprobar permiso, comprobar estado, guardar) | Un solo método `TransicionarAsync` con la comprobación y la transición como parámetros |
| 3 | `ReservaService.cs`: 9 líneas del mismo patrón en otra pareja de acciones | Mismo método |

### Bloques que quedan, y por qué

De los 9 bloques restantes, **6 son encabezados de archivo** (`using ...` y `namespace`) que C# obliga a repetir: no son lógica copiada y no se pueden quitar sin dejar de usar las clases. Los otros 3 son pequeños:

- `ReservaService.cs` líneas 107-113 y 198-204: «buscar la reserva con su historial y devolver *No encontrado*» al consultar y al cambiar de estado (7 líneas).
- `ConsultarDisponibilidadValidator.cs` y `CrearReservaValidator.cs`: tres llamadas de una línea a las reglas compartidas `ReglasDeAmbiente`, `ReglasDeFecha` y `ReglasDeHoras`. La lógica ya está definida una sola vez; solo se repite la llamada.
- `ReservasController.cs`: los atributos declarativos (`[Authorize]`, `[ProducesResponseType]`) de `aprobar` y `rechazar`.

### Qué se unificó (guiado por el informe)

| Zona | Antes | Ahora |
|---|---|---|
| Frontend, mensajes de error de la API | Cada hook y página traducía 400, 401, 403, 404, 409, 429, 5xx y falta de red por su cuenta | `services/mensajesDeResultado.js` (`mensajeDeError`, `alertaDeResultado`) |
| Frontend, estado de las acciones | `ejecutando` / alerta de éxito o error repetidos en cada hook | `hooks/useAccion.js` |
| Frontend, formularios | Cada formulario armaba sus campos y su envío | `hooks/useFormulario.js` (campos, validación, envío) y `hooks/useFormularioDeRegistro.js` (alta de usuario y de ambiente) |
| Frontend, páginas de error de ruta | Dos páginas con la misma estructura | `PaginaDeError` compartida en `ErrorRutaPage.jsx` |
| Backend, de resultado a HTTP | Cada acción de los cuatro controladores traducía `ResultadoXxx` a mano | `ControllerBaseExtensions`: `Traducir`, `Creado`, `CuerpoOVacio`, `DatosInvalidos` |
| Backend, validación en los servicios | Cada servicio repetía «validar y, si falla, devolver 400» | `ResultadoOperacion<T>.SiNoEsValido(...)` |
| Backend, contraseña | La regla de 8 a 72 caracteres con letra y número estaba en dos validadores | `Validators/ReglasDeContrasena.cs` (usada por `CrearUsuarioValidator` y `LoginRequestValidator`) |

## 2. Pruebas que impiden que vuelva la duplicación

- `frontend/src/arquitectura.test.js` falla si un archivo de `src/pages`, de `src/components` fuera de `ui` (Layout, DetalleReserva, FormularioTarjeta), o de cualquier otra carpeta de `src` escribe `<input>`, `<select>`, `<textarea>` o `<button>` en lugar de los componentes de `src/components/ui`. Se comprobó que falla poniendo un `<button>` en una pantalla y, al ampliarla, falló con los dos botones del `Layout`; se corrigieron con las variantes `sobreOscuro` y `sobreOscuroLista` de `Button` (prueba en `acciones.test.jsx`, captura del menú móvil abierto en `docs/evidencias/fase7/11-layout-menu-abierto-movil.png`).
- `frontend/src/constants/messages.test.js` falla si un mensaje de `messages.js` no existe idéntico en `MensajesValidacion` (o en `MensajesDominio`, que `MensajesValidacion` reexpone), y viceversa. Se comprobó cambiando un texto en un solo lado.

## 3. Componentes por pantalla

La tabla se **genera** con `node tools/reutilizacion/componentes-por-pantalla.mjs`: recorre los `import` y el JSX de `frontend/src` y reemplaza el bloque marcado; no se escribe a mano. «Directo» es que la pantalla escribe el componente en su propio JSX; «a través de otro componente» es que lo recibe por un componente (por ejemplo, `FormularioTarjeta` ya lleva `Button`) o por otra pantalla que reutiliza (`ListadoPage` sirve a `AmbientesPage` y `UsuariosPage`).

<!-- componentes:inicio -->
<!-- Generado por tools/reutilizacion/componentes-por-pantalla.mjs a partir de los import y el JSX de frontend/src. No editar a mano. -->

Pantallas recorridas (10): AmbienteFormPage, AmbientesPage, DetalleReservaPage, ErrorRutaPage, ListadoPage, LoginPage, NuevaReservaPage, PendientePage, UsuarioFormPage, UsuariosPage.

Componentes recorridos (17): los de `src/components`.

Componentes que ninguna pantalla usa todavía: `CardIndicador`.

| Componente | De los nueve del diseño | Pantallas que lo escriben (directo) | Pantallas que lo reciben a través de otro componente | Pantallas en total |
|---|---|---|---|---|
| `AlertMessage` | sí | AmbienteFormPage, DetalleReservaPage, ListadoPage, LoginPage, NuevaReservaPage | AmbientesPage, UsuarioFormPage, UsuariosPage | 8 |
| `Button` | sí | DetalleReservaPage, ListadoPage, LoginPage, NuevaReservaPage | AmbienteFormPage, AmbientesPage, UsuarioFormPage, UsuariosPage | 8 |
| `CampoFormulario` | no | — | AmbienteFormPage, LoginPage, NuevaReservaPage, UsuarioFormPage | 4 |
| `CardIndicador` | sí | — | — | 0 |
| `DateInput` | sí | NuevaReservaPage | — | 1 |
| `DetalleReserva` | no | DetalleReservaPage | — | 1 |
| `FormularioTarjeta` | no | AmbienteFormPage, NuevaReservaPage, UsuarioFormPage | — | 3 |
| `Icono` | no | — | AmbienteFormPage, AmbientesPage, DetalleReservaPage, ListadoPage, LoginPage, NuevaReservaPage, UsuarioFormPage, UsuariosPage | 8 |
| `Insignia` | no | AmbientesPage, NuevaReservaPage, UsuariosPage | DetalleReservaPage | 4 |
| `InterruptorActivo` | no | UsuarioFormPage | — | 1 |
| `Layout` | no | App.jsx (envuelve todas las rutas protegidas) | — | 1 |
| `ModalConfirmacion` | sí | DetalleReservaPage | — | 1 |
| `PasswordInput` | no | LoginPage, UsuarioFormPage | — | 2 |
| `SelectInput` | sí | AmbienteFormPage, NuevaReservaPage, UsuarioFormPage | — | 3 |
| `TableList` | sí | ListadoPage | AmbientesPage, UsuariosPage | 3 |
| `TextInput` | sí | AmbienteFormPage, LoginPage, NuevaReservaPage, UsuarioFormPage | — | 4 |
| `TimeInput` | sí | NuevaReservaPage | — | 1 |
<!-- componentes:fin -->

### Limitaciones que conviene decir

- `CardIndicador` está construido y probado, pero **ninguna pantalla lo usa todavía**: lo necesita el dashboard, que aún es una pantalla pendiente (`PendientePage`). La afirmación «los nueve componentes se usan en todas las pantallas» solo es cierta para ocho de los nueve.
- `useCarga` ahora traduce también 409 y 429 con el módulo compartido; antes mostraba un mensaje genérico en ese caso poco frecuente (cambio menor de comportamiento).
- jscpd mide texto repetido; no ve la repetición «de estructura» (por ejemplo, dos formularios que arman campos de manera parecida con nombres distintos). Esa se atacó a mano, y por eso el avance real es mayor que el número.
