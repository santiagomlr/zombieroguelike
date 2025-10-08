# Proyecto Vela Digital Survivors: Blueprint de Diseño

## Visión general
- **Elevator pitch:** shooter roguelite tipo *Vampire Survivors* ambientado en el universo Vela Digital, con estética neón oscura y gameplay arcade altamente rejugable.
- **Pilares creativos:**
  1. Flujo continuo de acción y decisiones en tiempo real.
  2. Flexibilidad data-driven para experimentar con balance sin recompilar.
  3. Herramientas internas que empoderan al equipo de diseño.
- **Plataformas objetivo:** PC (Steam, Steam Deck) con objetivo de 120 FPS / mínimo 60 FPS.

## Arquitectura técnica
### Motor
- **Opción primaria:** Unity 2022 LTS + URP (2D Renderer con luces dinámicas, VFX Graph limitado a 2D).
- **Opción alternativa:** Godot 4.x (renderizador Forward+ con luces 2D y post-proceso).
- Criterios: soporte multiplataforma, pipeline de assets 2D, posibilidad de scripting rápido para herramientas, comunidad y soporte a largo plazo.

### Patrones de diseño
- **ECS híbrido:**
  - Unity: combinar DOTS (Entities 1.0) para sistemas de combate y pooling con componentes MonoBehaviour para integración con URP/Timeline.
  - Godot: implementar ECS ligero sobre `Node` + `Resource`, priorizando componentes de datos serializables.
- **Data-driven:** uso de ScriptableObjects (Unity) o Resources JSON (Godot) para describir armas, ítems, enemigos, olas, eventos y perfiles de IA.
- **Separación núcleo vs herramientas:**
  - Núcleo de gameplay aislado en módulos `Core`, `Combat`, `Progression`, `AI`, `Wave`.
  - Herramientas editor integradas en `Tools` con inspector personalizado.

### Persistencia y configuración
- **Perfiles de datos:**
  - Armas: `WeaponProfile`, `ProjectileProfile`, `RecoilProfile`.
  - Enemigos: `EnemyArchetype`, `AIProfile`, `MutationProfile`.
  - Waves y eventos: `WaveCurve`, `EventDefinition`, `DifficultyScaling`.
  - Loot: `LootTable`, `DropSlot`, `RarityCurve`.
- **Formato:** ScriptableObject/JSON + soporte hot-reload en modo editor; runtime configurable mediante editor de depuración.
- **Telemetría:** envío a archivo local/endpoint con métricas de DPS, TTK, daño recibido, densidad enemiga, FPS.

## State Machine global
```
boot → start_menu → tutorial → gameplay (running | paused | gameover) → results
```
- Implementación: `GameStateMachine` con estados derivados de `GameState`.
- Gestión de transiciones por eventos (`GameEventBus`).
- Cada estado controla su escena/UI específica:
  - `boot`: carga assets esenciales, inicializa servicios (audio, datos, telemetría).
  - `start_menu`: navegación, selección de perfil, acceso a Wiki.
  - `tutorial`: escenario guiado, hints contextuales.
  - `gameplay`: subdivide en subestados `running`, `paused`, `gameover`; UI dinámica.
  - `results`: estadísticas, XP meta, recompensas.

## Sistemas de combate
### Modelo de arma modular
- Componentes configurables:
  - **Muzzle**: sprite/animación, offsets, FX de disparo.
  - **Projectile**: velocidad, vida, penetración, rebotado, trayectoria (lineal, curvada, boomerang).
  - **Trail/VFX**: color, intensidad, duración.
  - **Impacto**: daño base, daño en área, estados (quemar, ralentizar, shock).
  - **Spread/Recoil**: curva dependiente de cadencia, movimiento, upgrades.
- Perfiles clonables; el diseñador modifica parámetros para crear variaciones (e.g. SMG -> Minigun Caótica).

### Smart Aim
- Modos: `Nearest`, `Weakest`, `Smart`.
- `Smart` calcula score ponderando:
  - Distancia normalizada.
  - Visibilidad (línea de visión, obstrucción por obstáculos/eventos).
  - Daño potencial (según vulnerabilidades enemigas y tipo de proyectil).
  - Prioridad de objetivo definida en `AIProfile` del enemigo.
- Editor runtime para ajustar pesos y thresholds.

### Upgrades, ítems y tomos
- **Inventario activo:**
  - Ítems: slots ilimitados, sin duplicados; cada ítem añade modificador pasivo.
  - Tomos: máximo 3, enfocan sinergias; cada combinación desbloquea `SynergyDefinition`.
- **Sistema de sinergias:** detección mediante etiquetas (`Tags`), p.ej. `fire`, `piercing`, `rate_of_fire`.
- **Árbol de progreso:** opciones presentadas en cada subida de nivel; UI muestra DPS estimado y cambios de stats.

### Waves y eventos
- **WaveCurve:** define tiempo, densidad, escalado de HP/daño/velocidad.
- **Eventos:** tormentas, niebla, zonas de riesgo, bonus; se activan por triggers (tiempo, progreso wave).
- **Bosses:** desde wave 10; patrones únicos, telegráfos claros.
- **Editor de waves:** timeline visual con picos (bursts), caps y spawns; vista previa de dificultad proyectada.

## Enemigos y AI
- Tipos base: común (verde), intermedio (morado), élite (amarillo), bomber, hechicero, tanque, rápido, divisor.
- Cada tipo utiliza `AIProfile` que controla:
  - Velocidad, aceleración, evasión.
  - Prioridades de target (`player`, `turret`, `objective`), modificadores contextuales.
  - Comportamientos especiales (bomber detona bajo distancia X, hechicero dispara proyectiles teledirigidos, divisor spawnea minions al morir).
- Física: colisiones con empuje suave usando `Physics2D` / `Area2D`; evitar stacking mediante fuerza de separación.
- Futuro: `MutationProfile` para buffs temporales, sinergias entre enemigos.

## UX/UI
- **Minimapa:** renderizado en RenderTexture; íconos para XP, drops, bosses.
- **HUD:** barras HP/XP, progreso de wave (% kills/objetivo), objetivo activo, indicadores de cooldown.
- **Pausa:** countdown 3-2-1 al retomar; menú con tabs `Ajustes`, `Wiki`, `Créditos`.
- **Wiki interna:** desbloquea entries al descubrir ítems/enemigos.
- **Accesibilidad:** presets daltonismo, reducción de flashes, escala UI, rebind controles.

## Sensaciones y rendimiento
- **VFX:** trails, muzzle flashes, impactos con `ShaderGraph`; screen shake graduado, bloom y aberración cromática controlables.
- **SFX/Música:** sistema dinámico por capas (AudioMixer snapshots / buses); intensidad según densidad enemiga y estado wave.
- **Animaciones:** parpadeo por daño (`Shader`), dissolve al morir (`Shader` con máscara), hit-flash corto.
- **Optimización:**
  - Object pooling para proyectiles/enemigos.
  - Culling por distancia / cámara.
  - Batching de sprites, LOD para FX.
  - Objetivo 120 FPS PC, 60 FPS Steam Deck.

## Meta-progresión
- **Perfiles guardados:** runs, configuraciones de control, opciones de accesibilidad.
- **Moneda entre runs:** invertir en árbol de talentos persistente.
- **Tienda entre waves:** ofertas con riesgo/recompensa (maldiciones, rerolls, curas, mejoras).
- **Modos adicionales:** desafíos diarios con mutadores aleatorios, modo caos.

## QA y Testing
- **Unit tests:** validación de daño, loot, escalado de dificultad.
- **Automation:** pruebas de "no spawn si wave completada", soak tests con >1,000 enemigos, verificación de telemetría.
- **CI/CD:** pipeline que corre tests, genera reportes de performance y captura crashes.

## Herramientas internas
1. **Editor de Waves:**
   - Timeline visual, curva de dificultad, vista previa de spawns.
   - Ajuste de caps, bursts, eventos asociados.
2. **Editor de Loot Tables:**
   - UI con slots, probabilidades, rarezas.
   - Simulación rápida para verificar distribución.
3. **Editor de AI Profiles:**
   - Sliders para velocidad, agresividad, prioridades.
   - Vista previa de comportamiento en sandbox.
4. **Dashboard de balance:**
   - Métricas de DPS, TTK, heatmaps de muertes.
   - Comparador de builds/waves, exportable a CSV.

## Roadmap inicial (12 semanas)
1. **Semanas 1-2:** Setup motor, pipeline de assets, state machine base, data layer.
2. **Semanas 3-4:** Prototipo de combate, armas base, enemigo común, pooling.
3. **Semanas 5-6:** Sistema de waves, UI HUD básico, minimapa.
4. **Semanas 7-8:** Herramientas internas (wave editor, loot editor), telemetría básica.
5. **Semanas 9-10:** Meta-progresión inicial, tienda entre waves, tomos/sinergias.
6. **Semanas 11-12:** QA, optimización, accesibilidad, pulido de VFX/SFX.

## Riesgos y mitigaciones
- **Complejidad del ECS:** comenzar con ECS híbrido e iterar; documentar patrones.
- **Carga de herramientas:** priorizar wave editor y loot editor; dashboard en paralelo con telemetría.
- **Performance:** profiling desde prototipo; fijar budgets de draw calls y CPU temprano.

## Próximos pasos
- Validar motor (Unity vs Godot) con vertical slice de combate.
- Definir estilo visual (moodboard neón oscuro, UI mockups).
- Preparar backlog de features en gestor (Jira/Linear) alineado al roadmap.

