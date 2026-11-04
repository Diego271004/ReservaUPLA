#!/bin/bash
# Seis intentos de login seguidos desde la misma IP contra una API recién arrancada (límite: 5 por minuto).
# Uso (con la API y la base en marcha y el usuario inactivo ya creado):
#   CLAVE_PRUEBA="<clave de prueba>" API_URL=http://localhost:5264 bash tools/e2e/rate-limit.sh
# La clave llega por variable de entorno; el script no la imprime.
: "${CLAVE_PRUEBA:?Falta la variable CLAVE_PRUEBA}"
URL="${API_URL:-http://localhost:5264}/api/auth/login"
SALIDA="$(mktemp)"

intento() {
  printf '%-52s' "$1"
  local codigo
  codigo=$(curl -s -m 15 -o "$SALIDA" -w "%{http_code}" -X POST -H "Content-Type: application/json" \
    -d "{\"correo\":\"$2\",\"contrasena\":\"$3\"}" "$URL")
  printf 'HTTP %s  ' "$codigo"
  node -e "
const j = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
console.log(j.token ? 'token JWT emitido (rol ' + j.rol + ')' : JSON.stringify(j.mensaje ?? j.errors ?? j));" "$SALIDA"
}

echo "Seis intentos de login seguidos contra ${URL%/api/auth/login} (API recién arrancada)"
intento "1) Carla Rojas, clave correcta"                 carla.rojas@upla.edu.pe "$CLAVE_PRUEBA"
intento "2) Ana Torres, clave correcta"                  ana.torres@upla.edu.pe "$CLAVE_PRUEBA"
intento "3) Mario Huaman, clave correcta"                mario.huaman@upla.edu.pe "$CLAVE_PRUEBA"
intento "4) Carla Rojas, contrasena ERRONEA"             carla.rojas@upla.edu.pe "clave-erronea"
intento "5) Luis Quispe (INACTIVO), clave correcta"      luis.quispe@upla.edu.pe "$CLAVE_PRUEBA"
intento "6) sexto intento seguido (clave correcta)"      carla.rojas@upla.edu.pe "$CLAVE_PRUEBA"
echo "Cabeceras de la respuesta bloqueada:"
curl -s -m 10 -i -X POST -H "Content-Type: application/json" -d '{"correo":"x","contrasena":"y"}' "$URL" | grep -iE "^HTTP|retry-after" | tr -d '\r'
rm -f "$SALIDA"
