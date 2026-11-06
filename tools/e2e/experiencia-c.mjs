import {
  BASE,
  abrirNavegador,
  capturar,
  carpeta,
  iniciarSesion,
  leerSesion,
  nuevaPagina,
  ok,
  paso,
} from "./lib.mjs";

const navegador = await abrirNavegador();
const destino = carpeta("docs", "evidencias", "experiencia");
const roles = [
  ["admin", "carla.rojas@upla.edu.pe", "C-admin-disponibilidad-datos"],
  [
    "solicitante",
    "ana.torres@upla.edu.pe",
    "C-solicitante-disponibilidad-datos",
  ],
  [
    "responsable",
    "mario.huaman@upla.edu.pe",
    "C-responsable-disponibilidad-datos",
  ],
];
const sesiones = {};

try {
  paso("Sub-fase C: Disponibilidad por rol");
  for (const ancho of ["escritorio", "movil"]) {
    for (const [nombre, correo, prefijo] of roles) {
      const pagina = await nuevaPagina(navegador, ancho, sesiones[nombre]);
      if (!sesiones[nombre]) {
        await iniciarSesion(pagina, correo);
        await pagina.waitForURL("**/dashboard");
        sesiones[nombre] = await leerSesion(pagina);
      }
      await pagina.goto(`${BASE}/disponibilidad`);
      await pagina.getByRole("heading", { name: "Disponibilidad" }).waitFor();
      const links = pagina.getByRole("navigation", { name: "Principal" });
      if (ancho === "movil") {
        await pagina.getByRole("button", { name: "Menú", exact: true }).click();
      }
      await links.getByRole("link", { name: "Disponibilidad" }).waitFor();
      if (ancho === "movil") await pagina.keyboard.press("Escape");
      if (ancho === "escritorio") {
        const aside = await pagina.getByRole("complementary").boundingBox();
        if (!aside || aside.width !== 260)
          throw new Error(`${nombre}: menú no mide 260 px`);
      }
      await capturar(pagina, destino, prefijo, ancho);
      ok(`${nombre}: disponibilidad y menú visibles a ${ancho}`);
    }
  }

  const pagina = await nuevaPagina(navegador, "escritorio", sesiones.admin);
  await pagina.goto(`${BASE}/disponibilidad`);
  await pagina.waitForURL("**/disponibilidad");
  await pagina
    .getByRole("button", { name: /Libre, 07:00/ })
    .first()
    .click();
  await pagina.waitForURL(
    /\/reservas\/nueva\?.*ambienteId=.*fecha=.*horaInicio=07:00/,
  );
  await pagina.getByRole("heading", { name: "Nueva reserva" }).waitFor();
  ok("tramo libre navega a Nueva reserva con prerrelleno");
} finally {
  await navegador.close();
}
