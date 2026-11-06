// Ejecuta todas las fases de extremo a extremo en orden (5, 6, 7, 9, la ampliación de arquitectura de información y las sub-fases del rediseño de experiencia), cada una sobre una base recién creada y una API recién
// arrancada: ninguna depende de los datos que dejó otra, y el límite de intentos de login empieza de cero en cada fase.
// Las fechas de los guiones son relativas a hoy (RN-07 no admite fechas pasadas).
//
// Uso (desde tools/e2e):
//   PGPASSWORD="<clave de postgres>" CLAVE_PRUEBA="<clave de los usuarios de prueba>" npm run todo
// Requisitos: PostgreSQL en :5432, los user-secrets de la API configurados, el puerto 5263 (API) y el 5180 (frontend) libres.
// Este guion arranca y detiene la API y el frontend por su cuenta.
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  detenerEntorno,
  iniciarEntorno,
  reiniciarBaseYApi,
} from "./entorno.mjs";

const aqui = dirname(fileURLToPath(import.meta.url));
const FASES = [
  {
    nombre:
      "Fase 5 · entrada de datos (login, ambientes, usuarios, nueva reserva)",
    guion: "fase5.mjs",
  },
  {
    nombre:
      "Fase 6 · validaciones (disponibilidad, aprobar, conflicto, rechazar, cancelar)",
    guion: "fase6.mjs",
  },
  { nombre: "Fase 7 · ayuda del ambiente y RN-07", guion: "fase7.mjs" },
  {
    nombre:
      "Fase 9 · salida de datos (Dashboard, Reservas con filtros, Mi ambiente)",
    guion: "fase9.mjs",
  },
  {
    nombre:
      "Ampliación · arquitectura de información (etiquetas, regreso y menú en el detalle)",
    guion: "fase-ai.mjs",
  },
  {
    nombre:
      "Experiencia A · layout (menú colapsable, barra superior, menú de usuario, contador, avisos, panel móvil)",
    guion: "experiencia-a.mjs",
  },
  {
    nombre:
      "Layout · botón del menú móvil, Escape y cierre de sesión por el menú de usuario",
    guion: "layout-menu.mjs",
  },
  {
    nombre: "Sub-fase B · inicio por Administrador, Solicitante y Responsable",
    guion: "experiencia-b.mjs",
  },
  {
    nombre: "Sub-fase C · vista de disponibilidad por los tres roles",
    guion: "experiencia-c.mjs",
  },
];

const ejecutarGuion = (guion) =>
  spawnSync(process.execPath, [resolve(aqui, guion)], {
    cwd: aqui,
    stdio: "inherit",
    env: process.env,
  }).status === 0;

const resultados = [];
const inicio = Date.now();

try {
  await iniciarEntorno();
  for (const fase of FASES) {
    console.log(`\n${"=".repeat(100)}\n${fase.nombre}\n${"=".repeat(100)}`);
    console.log(
      "   recreando la base con los scripts de database/ y reiniciando la API…",
    );
    await reiniciarBaseYApi();
    resultados.push({ fase: fase.nombre, correcta: ejecutarGuion(fase.guion) });
  }
} catch (error) {
  console.error(`\nFALLO DEL ORQUESTADOR: ${error.message}`);
  resultados.push({ fase: "orquestador", correcta: false });
} finally {
  detenerEntorno();
}

console.log(
  `\n${"=".repeat(100)}\nRESUMEN (${Math.round((Date.now() - inicio) / 1000)} s, ${new Date().toISOString().slice(0, 10)})\n${"=".repeat(100)}`,
);
for (const { fase, correcta } of resultados)
  console.log(`  ${correcta ? "OK   " : "FALLO"}  ${fase}`);
const todoBien =
  resultados.length === FASES.length && resultados.every((r) => r.correcta);
console.log(
  `\nResultado general: ${todoBien ? "todo correcto" : "CON FALLOS"}`,
);
process.exit(todoBien ? 0 : 1);
