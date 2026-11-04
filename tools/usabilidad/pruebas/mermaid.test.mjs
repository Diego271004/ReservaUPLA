import assert from 'node:assert/strict'
import { test } from 'node:test'
import { extraerDiagramas, todosLosDiagramas } from '../validar-mermaid.mjs'

test('extrae cada bloque mermaid con la línea de su apertura y su código', () => {
  const texto = ['# t', '', '```mermaid', 'flowchart LR', '  A --> B', '```', 'texto', '```js', 'x', '```', '```mermaid', 'erDiagram', '```'].join('\n')
  const diagramas = extraerDiagramas(texto)
  assert.equal(diagramas.length, 2)
  assert.deepEqual(diagramas[0], { linea: 3, codigo: 'flowchart LR\n  A --> B' })
  assert.equal(diagramas[1].codigo, 'erDiagram')
})

test('encuentra los diagramas de docs/ (si no encontrara ninguno, la validación no valdría nada)', () => {
  const diagramas = todosLosDiagramas()
  assert.ok(diagramas.length >= 5)
  assert.ok(diagramas.some((d) => d.archivo === 'docs/usabilidad/arquitectura-de-informacion.md'))
})
