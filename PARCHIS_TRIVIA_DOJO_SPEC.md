# Parchis Trivia On-Chain Spec (Dojo) - v2

Estado: draft listo para implementacion  
Ultima actualizacion: 2026-03-06

## 1) Resumen ejecutivo

Este documento define el spec completo para un juego de trivia + Parchis usando Dojo Game Engine con logica autoritativa on-chain.

- 2-4 jugadores (humanos o agentes).
- Lobby por codigo para unirse.
- Frontend obligatorio con Cartridge Controller para manejo de wallets y sesiones.
- 4 fichas por jugador.
- Tablero original de Parchis (base, pista exterior, carriles de meta y centro).
- Turnos con 2 dados.
- Pregunta al inicio de cada turno.
- Captura de fichas ("comer") y retorno a base.
- Bloqueos cuando 2 fichas del mismo jugador estan en la misma casilla.
- Tienda en zonas seguras distribuidas por el tablero.
- Pantalla de configuracion pre-partida para crear `GameConfig` on-chain y usar `config_id` al crear juego.
- Gana quien lleva sus 4 fichas al centro.

## 2) Objetivos de producto

## 2.1 Objetivos

- Mantener gameplay reconocible de Parchis con una capa de trivia.
- Garantizar reglas del juego 100% verificables on-chain.
- Permitir sesiones rapidas por codigo de lobby.
- Permitir partidas personalizadas por configuracion (`GameConfig`) reusable.
- Tener UX clara para web desktop y mobile.
- Dejar una base tecnica que escale a agentes/autoplay.

## 2.2 No objetivos (MVP)

- No incluir chat de voz ni social feed.
- No incluir ranking global complejo en v1.
- No incluir anti-cheat off-chain invasivo.
- No incluir economia tokenizada externa en v1.

## 3) Reglas de gameplay

## 3.1 Setup de partida

- Cada partida tiene `max_players` en rango 2..4.
- Cada jugador inicia con 4 fichas en su base.
- Cada jugador tiene un color/asiento (`seat`): 0..3.
- En modo 2 jugadores se usan asientos opuestos del tablero.
- Cada partida referencia un `config_id` (GameConfig) fijo para toda su duracion.
- El orden de turnos se fija al iniciar partida.

## 3.2 Loop de turno (v2)

1. **Inicio de turno**: se valida jugador activo.
2. **Tiro de 2 dados**: D1 y D2 via VRF.
3. **Pregunta random**: 1 pregunta global del banco (no depende de casilla).
4. **Respuesta**:
   - Correcta: gana monedas y habilita movimiento.
   - Incorrecta: no gana monedas y termina turno sin mover.
5. **Movimiento** (si respuesta correcta):
   - Usa D1 y D2 en cualquier orden.
   - Puede mover una misma ficha dos veces o fichas distintas.
   - Se valida legalidad on-chain por cada paso.
6. **Tienda en zona segura**:
   - Si alguna jugada termina en casilla segura con tienda, se habilita fase de compra.
   - Compra opcional de items con monedas.
7. **Fin de turno**: avanza al siguiente jugador o se declara ganador.

## 3.3 Regla de salida de base

Para mantener estilo Parchis clasico:

- Default recomendado: una ficha sale de base con valor 5 en cualquiera de los dados.
- Si ambos dados son 5, puede sacar hasta 2 fichas (si hay cupo y legalidad).
- Configurable en `GameConfig` para variantes futuras.

Nota: se puede habilitar un `spawn_rule_mode` para soportar tambien la version "sale con par" como modo alterno, sin romper compatibilidad.

## 3.4 Reglas de movimiento y legalidad

- Cada dado se consume como una accion de movimiento (o salida de base).
- Si no hay jugada legal para un dado, ese dado se marca como no usable.
- Si existe jugada legal para un dado, el jugador debe ejecutar una jugada valida con ese dado para cerrar turno.
- No se permite atravesar bloqueos.
- Para entrar al centro/meta final se requiere llegada exacta.
- Movimientos que exceden meta exacta son invalidos.

## 3.5 Capturas (comer fichas)

- Si una ficha cae en casilla con exactamente 1 ficha rival y la casilla no es segura:
  - la ficha rival vuelve a base.
  - se emite evento `TokenCaptured`.
- En casillas seguras no se captura.
- Captura no puede violar reglas de bloqueo.

## 3.6 Bloqueos

- Dos fichas del mismo jugador en la misma casilla forman bloqueo.
- Ninguna ficha puede atravesar esa casilla mientras exista el bloqueo.
- El propio jugador puede romper su bloqueo moviendo una de las dos fichas.
- Si no puede romperlo legalmente en ese turno, se mantiene.

## 3.7 Zonas seguras + tienda

Cambio principal solicitado:

- La tienda vive en las zonas seguras distribuidas en el tablero.
- Implementacion recomendada MVP:
  - Todas las casillas seguras tienen `is_shop = true`.
  - La distribucion de zonas seguras/tienda se define por `config_id` (`BoardSquare`).
  - Si terminas movimiento en una zona segura, habilitas compra opcional al final del turno.
  - Limite MVP: maximo 1 compra por turno.

## 3.8 Preguntas y recompensas

- Pregunta siempre al inicio del turno.
- Categoria random global (pueden existir categorias internas para balancear contenido).
- Recompensa de monedas por respuesta correcta:
  - `reward = base_reward_by_difficulty * streak_multiplier` (opcional).
- Respuesta incorrecta:
  - `reward = 0`.
  - turno termina.

## 3.9 Condicion de victoria

- Gana el primer jugador que lleva sus 4 fichas al centro.
- La partida pasa a estado `FINISHED`.
- Se emite evento `GameWon`.

## 3.10 Timeouts y turnos perdidos

- Cada fase critica tiene `deadline` on-chain.
- Si expira, cualquiera puede llamar `force_skip_turn`.
- Evita partidas bloqueadas por abandono.

## 3.11 Partidas configurables por `GameConfig`

- Cada host puede crear una configuracion reusable (`GameConfig`) y luego crear lobby usando ese `config_id`.
- Un `GameConfig` define reglas y parametros de una partida sin tocar codigo.
- Una vez que un juego inicia, se recomienda snapshot inmutable de config para evitar cambios a mitad de partida.

Campos recomendados en `GameConfig`:

- `max_players` (2..4).
- `spawn_rule_mode` (`REQUIRE_5` o `REQUIRE_EVEN`).
- `question_set_id` y dificultad habilitada.
- `question_timer_secs`.
- `turn_timeout_secs`.
- `reward_easy`, `reward_medium`, `reward_hard`.
- `max_shop_purchases_per_turn`.
- `shop_enabled_on_safe_tiles`.
- `items_enabled_mask` o lista de items habilitados.

## 4) Modelo de tablero (Parchis)

## 4.1 Estructura logica

- `main_track_len`: longitud de pista exterior (configurable).
- `home_lane_len`: longitud carril de llegada por jugador (configurable).
- `start_index[seat]`: casilla de salida por jugador.
- `entry_to_home_index[seat]`: casilla de entrada a carril final.
- `safe_positions[]`: indices de casillas seguras.
- `shop_positions[]`: por defecto igual a `safe_positions[]`.

## 4.2 Tipo de casilla

- `NORMAL`
- `SAFE_SHOP` (segura y tienda)
- `START`
- `HOME_ENTRY`
- `HOME_LANE`
- `CENTER`

## 4.3 Modo 2 jugadores

- Se activan 2 colores opuestos.
- Se mantienen 4 bases en UI, pero 2 estan deshabilitadas.
- Logica de turnos y ocupacion solo para jugadores activos.

## 5) Arquitectura on-chain (Dojo)

## 5.1 Modelos Dojo (propuestos)

> Todos los modelos siguen reglas Dojo: `#[dojo::model]`, keys primero, `Drop + Serde`.

| Modelo | Key(s) | Campos importantes |
|---|---|---|
| `Game` | `game_id` | `status`, `max_players`, `player_count`, `turn_index`, `active_player`, `winner`, `config_id`, timestamps |
| `LobbyCodeIndex` | `code_hash` | `game_id`, `is_active` |
| `GamePlayer` | `(game_id, player)` | `seat`, `color`, `coins`, `tokens_in_base`, `tokens_in_goal`, `is_ready` |
| `Token` | `(game_id, player, token_id)` | `token_state`, `track_pos`, `home_lane_pos`, `steps_total`, `has_shield` |
| `TurnState` | `game_id` | `phase`, `active_player`, `dice_1`, `dice_2`, `die1_used`, `die2_used`, `question_id`, `question_answered`, `question_correct`, `shop_enabled`, `deadline` |
| `QuestionSet` | `set_id` | `merkle_root`, `question_count`, `version`, `enabled` |
| `PendingQuestion` | `(game_id, turn_index)` | `set_id`, `question_index`, `category`, `difficulty`, `seed_nonce` |
| `ItemDef` | `item_id` | `price`, `effect_type`, `effect_value`, `enabled` |
| `PlayerItem` | `(game_id, player, item_id)` | `amount` |
| `GameConfig` | `config_id` | `creator`, `name`, `max_players`, `spawn_rule_mode`, `question_set_id`, `question_timer_secs`, `turn_timeout_secs`, rewards, flags de tienda/items, `locked`, `enabled` |
| `BoardSquare` | `(config_id, square_index)` | `square_type`, `is_safe`, `is_shop` |
| `SquareOccupancy` | `(game_id, square_ref)` | conteos por asiento, bandera de bloqueo |

`square_ref` puede ser packed (`zone_type + zone_index`) para pista principal y carriles de meta.

## 5.2 Enums / constantes recomendadas

```text
GameStatus: WAITING, IN_PROGRESS, FINISHED, CANCELLED
TurnPhase: ROLL_AND_QUESTION, ANSWER_PENDING, MOVE_PENDING, SHOP_PENDING, TURN_ENDED
TokenState: IN_BASE, ON_TRACK, IN_HOME_LANE, IN_CENTER
SquareType: NORMAL, SAFE_SHOP, START, HOME_ENTRY, HOME_LANE, CENTER
ItemEffectType: SHIELD, REROLL_ONE_DIE, COIN_BOOST
SpawnRuleMode: REQUIRE_5, REQUIRE_EVEN (compatibilidad)
ConfigStatus: DRAFT, LOCKED, DISABLED
```

## 5.3 Sistemas y entrypoints (propuestos)

## 5.3.1 `config_system`

- `create_game_config(config_payload) -> config_id`
- `update_game_config(config_id, config_payload)` (solo `DRAFT`)
- `lock_game_config(config_id)`
- `disable_game_config(config_id)`
- `clone_game_config(base_config_id, overrides) -> config_id` (opcional)
- `set_board_square(config_id, square_index, square_type, is_safe, is_shop)`

Reglas:

- Solo creador/admin puede editar una config.
- `LOCKED` implica inmutable para uso en partidas nuevas.
- `DISABLED` no puede usarse para crear lobby.

## 5.3.2 `lobby_system`

- `create_lobby(code_hash, config_id)`
- `join_lobby_by_code(code_hash)`
- `set_ready(game_id, ready)`
- `start_game(game_id)`
- `leave_lobby(game_id)` (opcional MVP)

Validaciones:

- `config_id` existe y esta `LOCKED` o en estado permitido para produccion.
- `max_players` se toma de `GameConfig` (no se envia separado).
- codigo unico.
- no duplicar jugador.
- solo host o reglas acordadas para iniciar.

## 5.3.3 `turn_system`

- `roll_two_dice_and_draw_question(game_id)`
- `submit_answer_and_moves(game_id, answer_payload, move_plan)`
- `skip_shop(game_id)`
- `force_skip_turn(game_id)`

`move_plan` debe incluir uso de D1 y D2, orden, ficha objetivo y posibles salidas de base.

## 5.3.4 `movement_system` (interno o separado)

- `validate_move_step(...)`
- `apply_move_step(...)`
- `resolve_capture_if_any(...)`
- `recompute_blockade_state(...)`

## 5.3.5 `shop_system`

- `buy_item(game_id, item_id, target_token_id_opt)`
- `use_item(game_id, item_id, use_payload)`

Reglas:

- compra solo si `shop_enabled == true`
- saldo suficiente
- item habilitado
- respeta limites por turno

## 5.3.6 `admin_system`

- `set_global_defaults(...)`
- `set_question_set(...)`
- `set_item_def(...)`

Restringido por ownership/permissions.

### Snapshot de configuracion en inicio de partida (recomendado)

Para evitar mutaciones inesperadas:

- En `start_game(game_id)`, copiar los campos criticos de `GameConfig` a un runtime config del juego (`GameRuntimeConfig` o campos espejo en `Game`).
- Toda validacion de reglas en turno usa el snapshot, no la config editable original.
- Asi se permite evolucionar presets sin romper partidas ya creadas.

## 5.4 Flujo de pregunta con integridad verificable

Para reducir gas y mantener integridad del banco:

1. On-chain se guarda `QuestionSet.merkle_root`.
2. Al inicio del turno se elige `question_index` via VRF y se guarda en `PendingQuestion`.
3. Frontend obtiene contenido de pregunta (texto/opciones/metadata) desde IPFS/CDN.
4. En `submit_answer_and_moves`, jugador envia:
   - `question_leaf` (incluye `question_index`, `category`, `difficulty`, `correct_option`).
   - `merkle_proof`.
   - `selected_option`.
5. Contrato verifica prueba Merkle contra `merkle_root` y valida respuesta.

Ventaja: estado de juego y validacion siguen on-chain, pero se evita almacenar strings largos en storage.

## 5.5 Integracion VRF (Cartridge)

En cada turno, para obtener aleatoriedad verificable:

- multicall con `request_random` primero
- luego `roll_two_dice_and_draw_question`
- contrato consume random en la misma tx

De un mismo random se pueden derivar:

- `dice_1` (1..6)
- `dice_2` (1..6)
- `question_index` (0..question_count-1)

## 5.6 Permisos Dojo world

Ejemplo de estrategia de permisos:

- `config_system`, `lobby_system`, `turn_system`, `shop_system` como `writers` segun su dominio.
- `admin_system` (y opcionalmente `config_system`) como `owner` de namespace o modelos de configuracion.
- frontend y terceros solo lectura permissionless.

## 5.7 Eventos on-chain

Eventos minimos:

- `LobbyCreated`
- `PlayerJoined`
- `PlayerReadyChanged`
- `GameStarted`
- `TurnStarted`
- `DiceRolled`
- `QuestionDrawn`
- `AnswerResolved`
- `TokenMoved`
- `TokenCaptured`
- `BlockadeCreated`
- `BlockadeBroken`
- `ShopUnlocked`
- `ItemPurchased`
- `ItemUsed`
- `TurnEnded`
- `GameWon`

## 5.8 Invariantes criticas

- Cada jugador tiene exactamente 4 fichas siempre (sumando todos los estados).
- No hay posicion fuera de rango de tablero.
- No se puede atravesar bloqueo.
- No se captura en casilla segura.
- Solo jugador activo puede ejecutar acciones de turno.
- `coins` nunca negativas.
- No se puede comprar sin `shop_enabled` y saldo.
- `Game.config_id` debe existir y ser valido al crearse el juego.
- Las reglas efectivas de un juego no cambian durante la partida (snapshot estable).

## 6) Spec de frontend

## 6.1 Direccion visual

- Tablero original de Parchis (fiel en layout y lectura de zonas).
- Estetica colorida/casual inspirada en referencias de trivia.
- Bases claramente visibles con 4 slots por jugador.
- Zonas seguras con icono de tienda superpuesto.

## 6.2 Pantallas

- `Home`: nueva partida, unirse por codigo, instrucciones.
- `GameConfig`: crear/editar preset de reglas y guardar `config_id` on-chain.
- `Lobby`: codigo visible, jugadores conectados, estado ready.
- `GameBoard`: tablero, HUD, fichas, dados, botones de accion.
- `QuestionModal`: enunciado + opciones + timer.
- `ShopModal`: items disponibles y compra.
- `ResultModal`: ganador y resumen.

## 6.3 HUD requerido

- Jugador activo e indicador de turno.
- Dados D1/D2 y estado (usado/no usado).
- Monedas por jugador.
- Fichas en base, pista y centro por jugador.
- Indicador de bloqueo en casillas con 2 fichas del mismo jugador.
- Resumen de reglas activas (`config_id`) visible desde panel de partida.

## 6.4 Interaccion de turno en UI

1. Boton `Tirar dados`.
2. Mostrar pregunta.
3. Si acierta, habilitar seleccion de ficha y resaltado de jugadas legales por dado.
4. Aplicar movimiento del primer dado.
5. Aplicar movimiento del segundo dado (si legal).
6. Si hubo aterrizaje en `SAFE_SHOP`, abrir compra opcional.
7. Cerrar turno.

## 6.5 Estado y sincronizacion

- Fuente de verdad: modelos Dojo + eventos.
- Lecturas en tiempo real via Torii subscriptions.
- Estado local solo para UX transitoria (highlight, hover, animaciones).

## 6.6 Wallet y sesiones

- Requisito obligatorio: usar Cartridge Controller para manejo de wallets y sesiones.
- Stack recomendado: `@cartridge/controller`, `@cartridge/connector`, `@starknet-react/core`, `starknet`.
- Usar `ControllerConnector` creado fuera de componentes React.
- Session policies con least privilege para:
  - `create_game_config`, `update_game_config`, `lock_game_config`
  - `create_lobby`, `join_lobby_by_code`, `set_ready`, `start_game`
  - `roll_two_dice_and_draw_question`, `submit_answer_and_moves`, `skip_shop`
  - `buy_item`, `use_item`
- Multi-call para flujo VRF + roll.
- Sugerir `errorDisplayMode = notification` y politicas verificadas para mejor UX.

## 6.7 Mapeo tablero-logica

- Mantener archivo de geometria UI (`board_geometry.json/ts`) con:
  - coordenadas por `square_index`
  - coordenadas de bases y carriles de meta
  - capas de render para fichas apiladas
- Nunca hardcodear legalidad en frontend: la legalidad final siempre la decide contrato.

## 6.8 Flujo de configuracion de partida (nuevo)

Flujo recomendado desde frontend:

1. Host abre `GameConfig`.
2. Ajusta reglas (jugadores, spawn, timeouts, recompensas, items, question set).
3. Frontend llama `create_game_config(config_payload)` y recibe `config_id`.
4. Host opcionalmente bloquea config via `lock_game_config(config_id)`.
5. Frontend llama `create_lobby(code_hash, config_id)`.
6. Lobby muestra `config_id` y resumen de reglas para todos los jugadores.

Campos minimos visibles/editables en la pantalla `GameConfig`:

- Nombre de preset.
- Numero maximo de jugadores.
- Regla de salida de base (`REQUIRE_5` / `REQUIRE_EVEN`).
- Temporizador de pregunta y timeout de turno.
- Recompensas por dificultad.
- Habilitacion de items.
- Maximo de compras por turno.
- Set de preguntas activo (`question_set_id`).

## 6.9 Tech stack frontend (obligatorio)

- Package manager y runtime: `bun`.
- Framework base: `React` + `TypeScript` + `Vite`.
- Estilos: `TailwindCSS`.
- Integracion Dojo: `@dojoengine/core`, `@dojoengine/sdk`, `@dojoengine/torii-client`.
- Bindings tipados: generar con `sozo build --typescript` y consumirlos desde frontend.
- Wallet/session: `@cartridge/controller`, `@cartridge/connector`, `@starknet-react/core`, `@starknet-react/chains`, `starknet`.
- Estado cliente recomendado: `zustand` (o equivalente), manteniendo estado autoritativo en Dojo/Torii.
- Testing frontend recomendado: `vitest` + `@testing-library/react`; e2e opcional con `playwright`.

Comandos de bootstrap sugeridos:

```bash
bun create vite frontend --template react-ts
bun add @dojoengine/core @dojoengine/sdk @dojoengine/torii-client
bun add @cartridge/controller @cartridge/connector @starknet-react/core @starknet-react/chains starknet
bun add zustand
bun add -d tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom
```

## 7) Tienda: economia e items (MVP)

## 7.1 Reglas de compra

- Solo si `shop_enabled` en turno actual.
- Maximo 1 compra por turno (MVP).
- Descuento y stock global pueden agregarse luego.
- Disponibilidad y limites pueden variar por `GameConfig`.

## 7.2 Catalogo inicial sugerido

1. `Escudo` (precio 120)
   - Se asigna a una ficha.
   - La siguiente captura contra esa ficha se cancela y consume escudo.

2. `Re-roll` (precio 90)
   - Permite rerrollear 1 dado antes de mover.
   - Uso inmediato o en turno futuro segun config.

3. `Boost de monedas` (precio 100)
   - +50% monedas en la proxima respuesta correcta.

## 7.3 Balance inicial recomendado

- Recompensa por correcta:
  - facil: 60
  - media: 90
  - dificil: 130
- Ajustar luego con telemetria.

## 8) Estrategia de indexacion (Torii)

## 8.1 Query minima para pantalla de juego

- `Game`
- `GameConfig` (por `config_id` de la partida)
- `TurnState`
- `GamePlayer[]`
- `Token[]`
- `SquareOccupancy[]` (solo casillas ocupadas)

## 8.2 Subscriptions recomendadas

- `DiceRolled`, `AnswerResolved`, `TokenMoved`, `TokenCaptured`, `ItemPurchased`, `GameWon`.

## 9) Testing y QA

## 9.1 Tests de contrato (dojo-test)

Casos minimos:

- Crear `GameConfig`, bloquearlo y usar `config_id` al crear lobby.
- Crear lobby, unirse por codigo, iniciar partida.
- Orden de turnos correcto en 2, 3 y 4 jugadores.
- Tirada de 2 dados y almacenamiento en `TurnState`.
- Respuesta correcta habilita movimiento; incorrecta no mueve.
- Captura en casilla no segura devuelve ficha a base.
- No captura en casilla segura.
- Bloqueo impide atravesar.
- Bloqueo se rompe al mover una ficha del stack.
- Tienda habilitada solo al caer en zona segura.
- Zonas seguras/tienda se respetan segun `BoardSquare` del `config_id` activo.
- Compra rechazada por fondos insuficientes.
- Victoria al llegar 4 fichas a centro.
- `force_skip_turn` solo luego de deadline.
- Rechazo de acciones de jugador no activo.
- No permitir crear lobby con `config_id` inexistente o `DISABLED`.

## 9.2 Tests de invariantes

- Conservacion de 4 fichas por jugador.
- No existen dos estados simultaneos para una misma ficha.
- No hay overflow de posiciones.
- `shop_enabled` se resetea al cerrar turno.

## 9.3 QA frontend

- Flujo completo desktop y mobile.
- Animaciones de captura y retorno a base.
- Indicadores de bloqueo y zonas seguras/tienda.
- Recuperacion correcta tras refresh de navegador.

## 10) Seguridad y robustez

## 10.1 Seguridad funcional

- Check estricto de `active_player` en entrypoints de turno.
- `turn_index` y `phase` para evitar replay de tx.
- No confiar en calculos de frontend.

## 10.2 Seguridad de economia

- Validar precios/coins en contrato.
- Evitar doble gasto de item en misma fase.
- Clamp de cantidades y limites maximos.

## 10.3 Consideraciones de preguntas

- Modo abierto: jugador activo podria automatizar respuestas si conoce banco.
- Mitigacion MVP: timer corto + banco amplio + rotacion frecuente.
- Mitigacion avanzada: roots versionados y rotacion de sets por temporada.

## 11) Configuracion Dojo sugerida

## 11.1 Namespace y permisos

```toml
[namespace]
default = "parchis_trivia"

[writers]
"parchis_trivia-GameConfig" = ["parchis_trivia-config_system", "parchis_trivia-admin_system"]
"parchis_trivia-BoardSquare" = ["parchis_trivia-config_system", "parchis_trivia-admin_system"]
"parchis_trivia-Game" = ["parchis_trivia-lobby_system", "parchis_trivia-turn_system"]
"parchis_trivia-GamePlayer" = ["parchis_trivia-lobby_system", "parchis_trivia-turn_system", "parchis_trivia-shop_system"]
"parchis_trivia-Token" = ["parchis_trivia-turn_system"]
"parchis_trivia-TurnState" = ["parchis_trivia-turn_system"]
"parchis_trivia-PendingQuestion" = ["parchis_trivia-turn_system"]
"parchis_trivia-PlayerItem" = ["parchis_trivia-shop_system", "parchis_trivia-turn_system"]
"parchis_trivia-SquareOccupancy" = ["parchis_trivia-turn_system"]

[owners]
"parchis_trivia" = ["parchis_trivia-admin_system", "parchis_trivia-config_system"]
```

## 11.2 Despliegue local

1. `katana --dev --dev.no-fee`
2. `sozo build`
3. `sozo migrate`
4. `torii --world <WORLD_ADDRESS> --indexing.controllers`

## 12) Split para 2 personas

## 12.1 Persona A (Backend / Dojo)

- Modelos, enums, eventos.
- Sistemas de config, lobby, turno, movimiento, tienda, admin.
- Integracion VRF y validaciones.
- Integracion EGS on-chain (adapter, ERC721/SRC5, metadata, score/settings).
- Tests unitarios + integracion.
- Configuracion permisos y scripts deploy.

## 12.2 Persona B (Frontend)

- UI de home/configuracion/lobby/tablero/modales.
- Render de tablero Parchis original y fichas.
- Flujo de turno con 2 dados + pregunta.
- UX de captura, bloqueo y tienda en zonas seguras.
- Integracion wallet/session con Cartridge Controller + Torii realtime.
- Integracion de `GameConfig` end-to-end (crear config, mostrar `config_id`, crear lobby).

## 12.3 Contrato de integracion entre ambos

- Congelar temprano:
  - nombres de modelos
  - enums numericos
  - estructura de `move_plan`
  - nombres de eventos
- Congelar tambien:
  - estructura de `GameConfig` y estados (`DRAFT`, `LOCKED`, `DISABLED`)
  - mapping EGS `settings_id == config_id`
  - firma y semantica de `score(game_id)`
- Definir fixtures de test compartidos para 2 jugadores.
- Publicar artefactos versionados para frontend en cada corte:
  - `manifest_<profile>.json`
  - bindings TypeScript generados por `sozo build --typescript`
  - archivo de addresses (`contracts.json`)

## 12.4 Plan de trabajo paralelo (backend, frontend, EGS)

- Semana 1 (paralelo):
  - Persona A: modelos + entrypoints base + `GameConfig` + eventos.
  - Persona B: app shell React/Tailwind con Bun + pantallas Home/GameConfig/Lobby usando adapter mock.
- Semana 2 (paralelo):
  - Persona A: reglas Parchis core (2 dados, captura, bloqueo, tienda segura).
  - Persona B: tablero interactivo + HUD + flujo de turno conectado a Torii.
  - Persona A (frente EGS en paralelo): scaffold EGS (dependency, component, interfaces).
- Semana 3 (paralelo):
  - Persona A: score final + lifecycle + tests EGS/Budokan.
  - Persona B: hardening UX + estados de error Controller + QA mobile.

Regla de oro para evitar bloqueos:

- Frontend no espera contratos finales para avanzar: usa `GameGateway` tipado (mock -> on-chain implementation) desde el dia 1.

## 13) Milestones recomendados

## M1 - Core jugable

- Pantalla `GameConfig` + creacion de `config_id`
- Lobby por codigo
- Turnos con 2 dados
- Pregunta + validacion
- Movimiento basico + salida de base + victoria
- Scaffold frontend definitivo con Bun + React + TailwindCSS + Cartridge Controller
- Scaffold EGS (dependencia, contratos base, interfaces minimas)

## M2 - Reglas Parchis completas

- Capturas
- Bloqueos
- Casillas seguras
- Tienda en zonas seguras (1 compra por turno)
- Integracion frontend end-to-end con modelos/eventos reales de Dojo
- `mint/settings/score` EGS conectados con `config_id`

## M3 - Hardening

- Invariantes y tests de stress
- Pulido UX mobile
- Balance de economia e items
- Validacion de compatibilidad EGS en flujo de torneo objetivo

## 14) Criterios de aceptacion del MVP

- El frontend usa Cartridge Controller para autenticacion y ejecucion de transacciones.
- El frontend esta implementado con `React + TailwindCSS` usando `bun` como package manager/runtime.
- Existe pantalla de `GameConfig` que crea configuraciones on-chain y retorna `config_id`.
- Se puede crear lobby y unir por codigo con 2-4 jugadores.
- El lobby se crea con `config_id` valido y las reglas se respetan en toda la partida.
- Cada jugador inicia con 4 fichas en base.
- Cada turno lanza 2 dados y muestra pregunta.
- Solo si respuesta correcta se permite movimiento.
- Capturas y bloqueos funcionan como reglas de Parchis.
- Las zonas seguras funcionan tambien como tienda.
- Se puede comprar item en tienda con monedas.
- El primero en llevar 4 fichas al centro gana.
- Todo estado critico de juego se valida y persiste on-chain.
- Si se activa objetivo de prize pool completo, el contrato EGS expone `mint`, metadata, `score`, `setting_exists` y pasa tests de compatibilidad.

## 15) Riesgos y mitigaciones

- **Gas alto en validacion de movimiento**: usar estructuras de ocupacion compactas (`SquareOccupancy`) y evitar scans globales.
- **Complejidad de reglas Parchis**: priorizar MVP con flags de config para variantes.
- **Banco de preguntas grande**: usar Merkle root + contenido en IPFS/CDN con prueba on-chain.
- **Abandono de partidas**: timeouts y `force_skip_turn`.

## 16) Extensiones futuras

- Modo ranked con ELO on-chain.
- NPC/agent players con politicas predefinidas.
- Torneos por temporada.
- Items avanzados y eventos temporales.
- Modo equipos 2v2.

## 17) Integracion con Embeddable Game Standard (EGS) para prize pool completo

## 17.1 Conclusión de factibilidad

Si, **es viable** integrar este juego con el EGS de Provable Games y es el camino correcto para participar en el ecosistema de apps como Budokan y optar al prize pool completo.

La integracion requiere exponer interfaces y componentes estandar (ERC721 + metadata + settings + score) ademas de la logica Dojo existente.

## 17.2 Requisitos tecnicos EGS (segun docs)

Requisitos clave identificados:

- Dependencia `tournaments` en `Scarb.toml`.
- Integrar `game_component` de EGS.
- Exponer funciones requeridas:
  - `mint(player_name, settings_id, start, end, to) -> u64`
  - `game_metadata()`
  - `token_metadata(token_id)`
  - `game_count()`
  - `emit_metadata_update(game_id)`
  - `initializer(...)`
- Exponer vistas esperadas por plataformas:
  - `score(game_id) -> u32`
  - `setting_exists(settings_id) -> bool`

Referencias revisadas:

- `https://docs.provable.games/embeddable-game-standard`
- `https://docs.provable.games/embeddable-game-standard/key-functions`
- `https://docs.provable.games/embeddable-game-standard/implementation`

## 17.3 Encaje con este spec (`settings_id` <-> `config_id`)

Excelente compatibilidad con tu cambio de configuracion:

- En EGS, cada instancia se crea con `settings_id`.
- En este juego, cada partida se crea con `config_id`.
- Mapeo directo recomendado: `settings_id == config_id`.

De esta forma, la pantalla `GameConfig` del frontend tambien cumple rol de creador de settings para EGS.

## 17.4 Arquitectura recomendada de integracion

Para minimizar riesgo:

- Mantener el juego Dojo actual como motor principal (`config_system`, `lobby_system`, `turn_system`, etc.).
- Agregar un contrato adaptador EGS (o capa EGS en contrato de entrada) que:
  - implemente interfaces EGS/ERC721,
  - haga `mint` de instancia jugable,
  - vincule `token_id` EGS con `game_id` interno,
  - lea score final desde modelos Dojo.

Modelos de enlace sugeridos:

- `EgsTokenGameLink(token_id -> game_id)`
- `EgsPlayerEntry(token_id -> player, config_id)`

## 17.5 Estrategia de score para torneos/prize pool

EGS pide `score(game_id) -> u32`. Para multiplayer Parchis + trivia, se recomienda definir un score determinista, por ejemplo:

- `win_bonus` (alto para ganador)
- `tokens_at_center * weight`
- `coins * weight`
- `turns_penalty` (opcional)

Ejemplo de formula:

`score = win_bonus + (tokens_in_center * 1000) + coins - min(turns_used, 500)`

El score debe quedar fijo al terminar partida y emitirse `emit_metadata_update` cuando cambie metadata relevante.

## 17.6 Compatibilidad con lifecycle EGS

La guia EGS indica validar estado de lifecycle en interacciones:

- antes de acciones de juego, verificar que la instancia/token este en estado jugable y en ventana de tiempo (`start/end`) si aplica.

Esto encaja con nuestros `GameStatus` y `deadline`; solo hay que alinear estados.

## 17.7 Cambios concretos al backlog

Agregar tareas especificas:

1. Integrar dependencia `tournaments` y `build-external-contracts` requeridos.
2. Implementar componente EGS + storage/eventos ERC721/SRC5.
3. Implementar `score` y `setting_exists` usando modelos `Game` y `GameConfig`.
4. Conectar `mint(..., settings_id, ...)` con `create_lobby(..., config_id)`.
5. Añadir tests de compatibilidad EGS (mint, metadata, score, lifecycle).
6. Validar flujo end-to-end con plataforma target (Budokan).

## 17.8 Riesgos de integracion EGS (y mitigaciones)

- **Riesgo:** Budokan puede asumir experiencia single-run por token.  
  **Mitigacion:** definir claramente si el token representa entrada de jugador o match completo y documentar el mapping.

- **Riesgo:** discrepancia entre score esperado por torneo y score interno del juego.  
  **Mitigacion:** publicar formula de score versionada por `config_id`.

- **Riesgo:** sobrecarga de complejidad en MVP.  
  **Mitigacion:** implementar EGS en fase paralela, sin bloquear core loop, pero antes de release para prize pool.

## 17.9 Estado de decision

- Decision tecnica: **GO** para EGS.
- Prioridad: alta si objetivo inmediato es el prize pool completo.

## 17.10 Implementacion EGS en paralelo sin bloquear frontend

Para que EGS no frene el avance del juego base:

- Mantener interfaz de app estable basada en `game_id` y `config_id`.
- Implementar EGS en contrato/capa separada que agregue `token_id` y metadata.
- Exponer mapeo `token_id -> game_id` para navegacion y debug, sin cambiar UX principal.
- Frontend puede agregar vistas EGS (token metadata, score) como modulo incremental en M2/M3.

Dependencias minimas entre frentes:

- Backend core entrega `Game`, `GameConfig`, `TurnState`, eventos y reglas.
- EGS adapter consume estado final del backend core (`score`, lifecycle) sin alterar loop de turno.
- Frontend solo requiere addresses + ABIs/versiones congeladas por release.
