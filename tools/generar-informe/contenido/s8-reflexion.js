import { h1, h2, p, vinetas } from '../lib/word.js'

export function seccionReflexion() {
  return [
    h1('11. Reflexión final y conclusiones'),
    h2('11.1 La pregunta del caso'),
    p(
      '«¿Cómo contribuye la aplicación de estándares, la validación de datos, la reutilización de componentes y el refinamiento de código a mejorar la calidad, la mantenibilidad y la evolución del sistema ReservaUPLA?»',
    ),
    h2('11.2 Respuesta'),
    p(
      'Antes de este proyecto yo pensaba que la calidad del software era sobre todo que «funcione». ReservaUPLA me enseñó que funcionar es solo el punto de partida: lo que se nota con el tiempo es si el sistema se puede **cambiar sin miedo**, y eso depende de las cuatro prácticas que pide el caso. Cada una aportó algo distinto y comprobable.',
    ),
    p(
      '**Los estándares dieron orden y evitaron discusiones inútiles.** Tener decidido de antemano cómo se nombra, dónde va cada cosa, cómo se escribe un commit y qué capa puede depender de cuál hizo que el código fuera predecible: encontrar dónde se aplica una regla tardaba segundos. Y lo más valioso fue que muchos estándares se volvieron **pruebas automáticas**: una prueba falla si una pantalla escribe un botón a mano, si un color queda fuera de `tokens.css` o si la capa de aplicación referencia a la de infraestructura. Un estándar que nadie comprueba se olvida; uno que rompe la compilación se respeta.',
    ),
    p(
      '**La validación de datos en tres capas dio confianza.** Al principio validar en el frontend me parecía suficiente, hasta que escribí la prueba de las dos aprobaciones simultáneas y vi que dos personas pueden pasar el mismo aviso en el mismo segundo. El frontend ayuda al usuario, el backend decide y la base de datos es la última barrera: solo la restricción de exclusión de PostgreSQL garantiza de verdad que nunca haya dos reservas aprobadas que se crucen. Aprendí a no confiar en lo que viene del cliente y a que un mensaje claro («Ese ambiente ya tiene una reserva aprobada de 10:00 a 12:00») es parte de la validación, no un adorno.',
    ),
    p(
      '**La reutilización redujo el costo de cada cambio.** Con los nueve componentes y unos pocos hooks compartidos, un cambio se hace una vez y llega a todas las pantallas. La prueba más clara fue agregar el modo oscuro al final: como todos los colores salían de un solo archivo de tokens, no hubo que tocar ningún componente. Medí también la duplicación (de 1,38 % a 0,93 %) y entendí que el número importa menos que el hábito de preguntarse «¿esto ya existe?» antes de copiar.',
    ),
    p(
      '**El refinamiento me enseñó a desconfiar de mis propias pruebas.** Refactorizar sin pruebas es un riesgo, y con ellas es una rutina. Pero lo que más aprendí fue otra cosa: con más de mil pruebas en verde, al levantar el sistema con datos reales aparecieron defectos que ninguna cubría, como que «Tu próxima reserva» mostrara una reserva cancelada o que un menú contraído quedara de 80 píxeles de alto. Refinar no es solo ordenar el código; es mirar el sistema funcionando, encontrar lo que falla y dejar una prueba para que no vuelva.',
    ),
    h2('11.3 Qué mejoró en calidad, mantenibilidad y evolución'),
    ...vinetas([
      '**Calidad:** las reglas de negocio se cumplen aunque alguien se salte el formulario, y los mensajes son iguales en las tres capas.',
      '**Mantenibilidad:** capas con dependencias en una sola dirección, una sola fuente de textos, colores y formas, archivos cortos y una red de pruebas que avisa de inmediato si un cambio rompe algo.',
      '**Evolución:** se pudieron agregar, ya con el sistema terminado, una vista de disponibilidad, indicadores de gestión, un registro de actividad y un modo oscuro sin reescribir lo anterior. Cada una se apoyó en piezas que ya existían.',
    ]),
    h2('11.4 Limitaciones y trabajo pendiente'),
    ...vinetas([
      'No se midió la escalabilidad con carga (miles de reservas o usuarios simultáneos): el informe afirma que el sistema está preparado, no que se haya demostrado.',
      'La última ejecución completa de las pruebas de la API, del extremo a extremo y de la accesibilidad automatizada es del 7 de noviembre; los cambios posteriores se verificaron con pruebas unitarias y revisión en pantalla (sección 10.1).',
      'Falta la prueba de usabilidad con compañeros: [COMPLETAR POR EL ESTUDIANTE: fecha, número de participantes y hallazgos].',
      'Fuera del alcance por decisión del análisis: notificaciones por correo, reservas recurrentes, calendario semanal o mensual, exportación y recuperación de contraseña.',
    ]),
  ]
}
