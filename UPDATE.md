# UPDATE — imagic-browser-launcher

> Аудит проведён: 2026-03-22. Версия на момент аудита: 1.0.1

---

## Критические баги (исправить немедленно)

- [ ] **Signal listener accumulation** — `process.once('SIGINT')` и `process.once('SIGTERM')` регистрируются при каждом вызове `launch()`. Если `launch()` вызван несколько раз (например, после kill + restart), накапливаются дублирующие обработчики. Нужно хранить ссылку на handler и снимать перед повторной регистрацией.

- [ ] **`this.url` в Set флагов** — URL передаётся в `finalFlags.add(this.url)` как будто это CLI-флаг. URL не является флагом и должен передаваться как отдельный positional аргумент в `spawn(bin, [...flags, this.url])`.

- [ ] **Silent errors в prod** — в `launch()` ошибка логируется только в debug-режиме (`this.log(...)`), после чего перебрасывается. В production ошибка молча исчезает из логов. Ошибка должна логироваться всегда (через `console.error` или переданный logger), независимо от debug-режима.

---

## package.json

- [ ] Добавить поле `"exports"` (сейчас только `"main"`, что игнорируется бандлерами)
  ```json
  "exports": { ".": "./src/index.js", "./package.json": "./package.json" }
  ```
- [ ] Добавить `"files": ["src", "README.md", "LICENSE"]`
- [ ] Добавить `"sideEffects": false`
- [ ] Обновить `"engines"` — уже есть `>=20`, ок

---

## ESLint

- [ ] **Мигрировать с ESLint 8 + Airbnb → ESLint 10 flat config**
  - Удалить: `eslint ^8.57.1`, `eslint-config-airbnb`, `eslint-plugin-node`
  - Установить: `eslint ^10.1.0`, `@eslint/js ^10.0.1`, `eslint-plugin-n ^17.24.0`
  - Удалить `.eslintrc` (legacy config)
  - Создать `eslint.config.js` по шаблону из `STANDARD.md`
- [ ] `eslint-plugin-node` устарел — заменён на `eslint-plugin-n`
- [ ] `eslint-config-airbnb` несовместим с ESLint 10 и не используется нигде ещё — убрать

**Целевые версии:**
```json
"@eslint/js": "^10.0.1",
"eslint": "^10.1.0",
"eslint-config-prettier": "^10.1.8",
"eslint-plugin-import": "^2.32.0",
"eslint-plugin-n": "^17.24.0",
"eslint-plugin-prettier": "^5.5.5",
"eslint-plugin-promise": "^7.2.1",
"globals": "^16.x",
"prettier": "^3.8.1"
```

---

## Тесты

Сейчас тестов нет совсем. Написать `tests/launcher.test.js`:

- [ ] Constructor применяет дефолты если опции не переданы
- [ ] `getFlags()` добавляет `--remote-debugging-port` когда port задан и не дублируется
- [ ] `getFlags()` не добавляет дублирующие флаги при совпадающих ключах
- [ ] URL передаётся как positional аргумент (не через Set флагов) — после фикса
- [ ] `kill()` выставляет `this.process = null` после завершения
- [ ] `launch()` возвращает без броска если уже запускается (concurrent call guard через `_isLaunching`)
- [ ] `isDebuggerReady()` возвращает `false` при ошибке соединения
- [ ] `getRandomPort()` возвращает число в допустимом диапазоне портов (1024–65535)
- [ ] `launchTimeout` ограничивает время ожидания

---

## Улучшения API (minor bump)

- [ ] **Извлечь `getRandomPort.js` в `imagic-utils`** — общая утилита без привязки к браузеру, дублирование в экосистеме. Либо добавить как Node-only экспорт в utils, либо задокументировать намеренное zero-dep решение.
- [ ] **Сделать `kill()` async** — сейчас функция синхронная, но вызывается через `await`. Явно задокументировать или сделать `Promise`-based для консистентности.
- [ ] **JSDoc** на все публичные методы: `launch()`, `kill()`, `isDebuggerReady()`, `waitUntilReady()`, `getFlags()`
- [ ] Расширить README: добавить секцию API с описанием всех параметров конструктора

---

## Задачи (backlog)

- [ ] Поддержка других браузеров помимо Chromium (Firefox через `--remote-debugging-port`)
- [ ] Экспортировать тип `LauncherOptions` для проектов на TypeScript
- [ ] Graceful shutdown при `SIGTERM`: дождаться завершения браузера перед kill()
