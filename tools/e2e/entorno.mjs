// Entorno de las pruebas de extremo a extremo: recrear la base, arrancar y detener la API y el frontend.
// Lo usan todo.mjs y las mediciones de tools/usabilidad. Requiere PGPASSWORD y CLAVE_PRUEBA (ver recrear-bd.sh).
import { spawn, spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { API, BASE, RAIZ } from "./lib.mjs";

const aqui = dirname(fileURLToPath(import.meta.url));
const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));
const procesos = [];
let api = null;

export const responde = (url) =>
  fetch(url, { signal: AbortSignal.timeout(2000) }).then(
    () => true,
    () => false,
  );

async function esperarA(url, nombre, intentos = 90) {
  for (let i = 0; i < intentos; i++) {
    if (await responde(url)) return;
    await esperar(1000);
  }
  throw new Error(`${nombre} no respondió en ${url}`);
}

function arrancar(comando, argumentos, carpeta) {
  const hijo = spawn(comando, argumentos, {
    cwd: carpeta,
    stdio: "ignore",
    shell: process.platform === "win32",
    windowsHide: true,
  });
  procesos.push(hijo);
  return hijo;
}

function detener(hijo) {
  if (!hijo || hijo.exitCode !== null) return;
  if (process.platform === "win32")
    spawnSync("taskkill", ["/PID", String(hijo.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  else hijo.kill("SIGTERM");
}

export async function iniciarEntorno() {
  if (!process.env.PGPASSWORD)
    throw new Error("Falta la variable PGPASSWORD (clave de postgres).");
  if ((await responde(`${API}/api/salud`)) || (await responde(BASE))) {
    throw new Error(
      "Ya hay algo escuchando en la API (:5263) o en el frontend (:5180). Deténlos: este guion los arranca solo.",
    );
  }
  console.log("Compilando la API una vez…");
  const compilacion = spawnSync(
    "dotnet",
    [
      "build",
      "--nologo",
      "-v",
      "q",
      resolve(RAIZ, "backend", "ReservaUPLA.API"),
    ],
    {
      encoding: "utf8",
      shell: process.platform === "win32",
    },
  );
  if (compilacion.status !== 0)
    throw new Error(`dotnet build falló:\n${compilacion.stdout}`);
  arrancar("npx", ["vite"], resolve(RAIZ, "frontend"));
  await esperarA(BASE, "El frontend");
}

export async function reiniciarBaseYApi() {
  detener(api);
  await esperar(1500);
  const rutaRecrear = resolve(aqui, "recrear-bd.sh")
    .replaceAll("\\", "/")
    .replace(
      /^([A-Za-z]):/,
      (_coincidencia, unidad) => `/${unidad.toLowerCase()}`,
    );
  const bash =
    process.platform === "win32"
      ? "C:\\Program Files\\Git\\bin\\bash.exe"
      : "bash";
  const resultado = spawnSync(bash, [rutaRecrear], {
    cwd: RAIZ,
    encoding: "utf8",
    env: process.env,
    shell: false,
  });
  if (resultado.status !== 0)
    throw new Error(
      `No se pudo recrear la base:\n${resultado.stdout}\n${resultado.stderr}`,
    );
  console.log(`   ${resultado.stdout.trim().split("\n").at(-1)}`);
  api = arrancar(
    "dotnet",
    ["run", "--no-build", "--launch-profile", "http"],
    resolve(RAIZ, "backend", "ReservaUPLA.API"),
  );
  await esperarA(`${API}/api/salud`, "La API");
}

export function detenerEntorno() {
  detener(api);
  procesos.forEach(detener);
}
