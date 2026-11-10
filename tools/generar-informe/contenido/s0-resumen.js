import { h1, h2, p, tabla, vinetas } from '../lib/word.js'
import { PRUEBAS, estadisticasDeGit, tamanoDelCodigo } from '../lib/datos.js'

export function seccionResumen() {
  const git = estadisticasDeGit()
  const codigo = tamanoDelCodigo()
  return [
    h1('Resumen'),
    p(
      'ReservaUPLA es una aplicación web para registrar, validar, consultar y visualizar las reservas de laboratorios, auditorios y salas de la Universidad Peruana Los Andes. Reemplaza los mensajes, las llamadas y los documentos físicos con un flujo único: el solicitante pide un ambiente, el sistema comprueba la disponibilidad, el administrador aprueba o rechaza y cada cambio queda registrado con quién lo hizo y cuándo.',
    ),
    p(
      '**Construcción.** Backend en ASP.NET Core (.NET 8) con Clean Architecture, base de datos PostgreSQL creada por terminal con scripts SQL (sin migraciones) y frontend en React con Vite. Se desarrolló de forma incremental durante las nueve semanas: análisis, ciclo de vida, estándares, estructura, formularios, validaciones, reutilización, refinamiento y módulos de salida de datos.',
    ),
    h2('Cifras del proyecto'),
    ...tabla(
      ['Dato', 'Valor', 'Cómo se obtuvo'],
      [
        ['Requerimientos funcionales del caso', '8 de 8 (RF-01 a RF-08)', 'Sección 1.4, con el archivo y la línea de cada uno'],
        ['Reglas de negocio del caso', '6 de 6 (RN-01 a RN-06), más 2 agregadas (RN-07 y mantenimiento)', 'Sección 6, aplicadas en frontend, backend y base de datos'],
        ['Componentes reutilizables mínimos', '9 de 9', 'Sección 7, con el número de archivos que usa cada uno'],
        ['Indicadores mínimos del dashboard', '5 de 5, más 2 de gestión', 'Sección 9'],
        ['Commits en el repositorio', `${git.commits}`, `git rev-list (rama actual: ${git.ramaActual})`],
        ['Archivos de código', `${codigo.archivosFrontend} de frontend (sin pruebas) y ${codigo.archivosBackend} de backend (sin pruebas)`, 'Contados al generar este informe'],
        [
          'Pruebas automáticas',
          `${PRUEBAS.frontend.total} de frontend, ${PRUEBAS.backendAplicacion.total + PRUEBAS.backendInfraestructura.total} de backend medidas el ${PRUEBAS.backendAplicacion.fecha} y ${PRUEBAS.backendApi.total} de la API (última ejecución completa el ${PRUEBAS.backendApi.fecha})`,
          'Sección 10.1, con comando, fecha y límites de cada ejecución',
        ],
      ],
      [0.3, 0.38, 0.32],
    ),
    h2('Dónde está cada criterio de evaluación del caso'),
    p('La tabla sigue los criterios del enunciado (20 puntos) y dice en qué sección está la evidencia de cada uno.'),
    ...tabla(
      ['Criterio del caso', 'Puntaje', 'Sección', 'Evidencia principal'],
      [
        ['Análisis del problema, actores y alcance', '2', '1', 'Problema, actores, alcance, RF y RN con su evidencia'],
        ['Justificación del ciclo de vida', '2', '2', 'Modelo incremental e iterativo, comparación con otros tres modelos'],
        ['Aplicación de estándares de construcción', '2', '3', 'Nombres, carpetas, commits y ramas, y su verificación'],
        ['Implementación de formularios de entrada', '3', '5', 'Tres formularios (usuario, ambiente, reserva) con capturas'],
        ['Validaciones frontend y backend', '3', '6', 'Cada regla en tres capas, con la prueba que la rompe a propósito'],
        ['Reutilización de componentes', '2', '7', 'Los nueve componentes, su uso y la prueba que impide duplicar'],
        ['Refinamiento de código', '2', '8', 'Refactorizaciones, defectos hallados y corregidos'],
        ['Módulos de salida y dashboard', '3', '9', 'Listado, detalle, dashboard por rol'],
        ['Presentación y sustentación', '1', 'Anexo A y 11', 'Cómo ejecutarlo y la reflexión final'],
      ],
      [0.4, 0.1, 0.12, 0.38],
    ),
    p(
      'Los entregables del punto 11 del enunciado están así: repositorio (sección 3 y Anexo A), backend funcional (secciones 4 y 6), frontend funcional (secciones 5, 7 y 9), base de datos implementada (sección 4), evidencia de validaciones (sección 6), capturas del dashboard (sección 9), este informe y la sustentación.',
    ),
  ]
}
