# Сторонние материалы / Third-party materials

Проверка / Reviewed: 2026-10-18.

Этот перечень разграничивает права и не заменяет лицензии правообладателей.
Он не подтверждает наличие разрешений на каждый файл каталога. Для конкретного
файла проверяются источник, версия, лицензия и необходимые уведомления.

This inventory distinguishes rights; it does not replace upstream licenses
or establish permission for every catalog asset. Check the source, version,
license and required notices for each particular file.

| Материалы / Materials | Условия / Terms |
|---|---|
| `js/vendor/jszip.min.js`, JSZip 3.10.1 | MIT OR GPL-3.0-or-later; MIT is an available option. [Upstream license](https://github.com/Stuk/jszip/blob/v3.10.1/LICENSE.markdown); the embedded notice is retained. |
| pako (JSZip dependency) | MIT AND Zlib in the lockfile; retain applicable notices. [Upstream](https://github.com/nodeca/pako). |
| `js/vendor/confetti.min.js`, canvas-confetti 1.9.4 | [ISC](https://github.com/catdad/canvas-confetti/blob/master/LICENSE); local header identifies version 1.9.4. |
| Lucide paths in `js/category-icons.js`, `scripts/lib/blog-cover.js` and UI | [ISC, with MIT notices for Feather-derived icons](https://github.com/lucide-icons/lucide/blob/main/LICENSE). These are third-party icons, not exclusive project artwork. |
| `assets/fonts/inter-*.woff2` | Inter: [SIL Open Font License 1.1](https://github.com/rsms/inter/blob/master/LICENSE.txt). The exact local font version and embedded notices require verification before redistribution. |
| `assets/emoji/` | Apple, Google and Microsoft artwork: rights remain with the respective holders. Unicode characters and vendor artwork are distinct. No blanket project license is asserted; permissions must be checked per source and asset. |
| `assets/logos/` | Brand assets: the relevant rights holders' permissions and law apply. Public availability alone is not a license. |
| `assets/easter-egg/doodlejump/` | Includes Phaser 2.6.2 (local header), FULLTILT 0.7 (local header) and game artwork/code. Asset provenance and redistribution permissions require a separate file-level audit; these are not declared project-owned. |
| Public npm / VS Code integrations | Separate [trace-logos-integrations repository](https://github.com/arturablyazov5-glitch/trace-logos-integrations): use the MIT notices shipped with the relevant release. |

## npm: package-lock.json

Ниже перечислены лицензионные обозначения всех зафиксированных зависимостей,
включая платформенные optional-пакеты, а не только установленные на этой машине.
Метаданные lockfile не заменяют тексты лицензий и NOTICE конкретных релизов.
Сборочные зависимости не становятся собственностью проекта; включение их
результатов в дистрибутив оценивается по условиям соответствующей зависимости.

The following records every locked dependency, including platform-specific
optional packages, rather than only packages installed on this machine.
Lockfile metadata does not replace release license texts or NOTICE files.
Build tools remain third-party software; obligations for distributed outputs
must be assessed under each relevant license.

### (MIT AND Zlib)

- `pako` — 1.0.11

### (MIT OR GPL-3.0-or-later)

- `jszip` — 3.10.1

### 0BSD

- `tslib` — 2.8.1

### Apache-2.0

- `@img/sharp-darwin-arm64` — 0.34.5
- `@img/sharp-darwin-x64` — 0.34.5
- `@img/sharp-linux-arm` — 0.34.5
- `@img/sharp-linux-arm64` — 0.34.5
- `@img/sharp-linux-ppc64` — 0.34.5
- `@img/sharp-linux-riscv64` — 0.34.5
- `@img/sharp-linux-s390x` — 0.34.5
- `@img/sharp-linux-x64` — 0.34.5
- `@img/sharp-linuxmusl-arm64` — 0.34.5
- `@img/sharp-linuxmusl-x64` — 0.34.5
- `@puppeteer/browsers` — 3.0.4
- `chromium-bidi` — 16.0.1
- `detect-libc` — 2.1.2
- `puppeteer` — 25.1.0
- `puppeteer-core` — 25.1.0
- `sharp` — 0.34.5
- `webdriver-bidi-protocol` — 0.4.2

### Apache-2.0 AND LGPL-3.0-or-later

- `@img/sharp-win32-arm64` — 0.34.5
- `@img/sharp-win32-ia32` — 0.34.5
- `@img/sharp-win32-x64` — 0.34.5

### Apache-2.0 AND LGPL-3.0-or-later AND MIT

- `@img/sharp-wasm32` — 0.34.5

### BSD-2-Clause

- `terser` — 5.49.0

### BSD-3-Clause

- `devtools-protocol` — 0.0.1624250
- `source-map` — 0.6.1

### ISC

- `cliui` — 8.0.1
- `get-caller-file` — 2.0.5
- `inherits` — 2.0.4
- `semver` — 7.8.1
- `y18n` — 5.0.8
- `yargs-parser` — 21.1.1

### LGPL-3.0-or-later

- `@img/sharp-libvips-darwin-arm64` — 1.2.4
- `@img/sharp-libvips-darwin-x64` — 1.2.4
- `@img/sharp-libvips-linux-arm` — 1.2.4
- `@img/sharp-libvips-linux-arm64` — 1.2.4
- `@img/sharp-libvips-linux-ppc64` — 1.2.4
- `@img/sharp-libvips-linux-riscv64` — 1.2.4
- `@img/sharp-libvips-linux-s390x` — 1.2.4
- `@img/sharp-libvips-linux-x64` — 1.2.4
- `@img/sharp-libvips-linuxmusl-arm64` — 1.2.4
- `@img/sharp-libvips-linuxmusl-x64` — 1.2.4

### MIT

- `@emnapi/runtime` — 1.10.0
- `@esbuild/aix-ppc64` — 0.28.2
- `@esbuild/android-arm` — 0.28.2
- `@esbuild/android-arm64` — 0.28.2
- `@esbuild/android-x64` — 0.28.2
- `@esbuild/darwin-arm64` — 0.28.2
- `@esbuild/darwin-x64` — 0.28.2
- `@esbuild/freebsd-arm64` — 0.28.2
- `@esbuild/freebsd-x64` — 0.28.2
- `@esbuild/linux-arm` — 0.28.2
- `@esbuild/linux-arm64` — 0.28.2
- `@esbuild/linux-ia32` — 0.28.2
- `@esbuild/linux-loong64` — 0.28.2
- `@esbuild/linux-mips64el` — 0.28.2
- `@esbuild/linux-ppc64` — 0.28.2
- `@esbuild/linux-riscv64` — 0.28.2
- `@esbuild/linux-s390x` — 0.28.2
- `@esbuild/linux-x64` — 0.28.2
- `@esbuild/netbsd-arm64` — 0.28.2
- `@esbuild/netbsd-x64` — 0.28.2
- `@esbuild/openbsd-arm64` — 0.28.2
- `@esbuild/openbsd-x64` — 0.28.2
- `@esbuild/openharmony-arm64` — 0.28.2
- `@esbuild/sunos-x64` — 0.28.2
- `@esbuild/win32-arm64` — 0.28.2
- `@esbuild/win32-ia32` — 0.28.2
- `@esbuild/win32-x64` — 0.28.2
- `@img/colour` — 1.1.0
- `@jridgewell/gen-mapping` — 0.3.13
- `@jridgewell/resolve-uri` — 3.1.2
- `@jridgewell/source-map` — 0.3.11
- `@jridgewell/sourcemap-codec` — 1.5.5
- `@jridgewell/trace-mapping` — 0.3.31
- `acorn` — 8.18.0
- `ansi-regex` — 5.0.1
- `ansi-styles` — 4.3.0
- `buffer-from` — 1.1.2
- `color-convert` — 2.0.1
- `color-name` — 1.1.4
- `commander` — 2.20.3
- `core-util-is` — 1.0.3
- `emoji-regex` — 8.0.0
- `esbuild` — 0.28.2
- `escalade` — 3.2.0
- `immediate` — 3.0.6
- `is-fullwidth-code-point` — 3.0.0
- `isarray` — 1.0.0
- `lie` — 3.3.0
- `lilconfig` — 3.1.3
- `mitt` — 3.0.1
- `modern-tar` — 0.7.6
- `process-nextick-args` — 2.0.1
- `readable-stream` — 2.3.8
- `require-directory` — 2.1.1
- `safe-buffer` — 5.1.2
- `setimmediate` — 1.0.5
- `source-map-support` — 0.5.21
- `string-width` — 4.2.3
- `string_decoder` — 1.1.1
- `strip-ansi` — 6.0.1
- `typed-query-selector` — 2.12.2
- `util-deprecate` — 1.0.2
- `wrap-ansi` — 7.0.0
- `ws` — 8.21.0
- `yargs` — 17.7.2
- `zod` — 3.25.76

## Сохранение уведомлений / Retaining notices

Сохраняйте требуемые лицензиями уведомления об авторстве, разрешениях и
отказе от гарантий при распространении сторонних компонентов. Общий запрет
на копирование материалов Trace Logo’s не распространяется на использование,
разрешенное лицензиями этих компонентов. Непроверенная принадлежность или
лицензия материала не является основанием заявлять на него исключительные права.

Retain copyright, permission and disclaimer notices required by upstream
licenses when redistributing components. Project content restrictions do not
limit uses permitted by those licenses. Unverified ownership or licensing is
not a basis for claiming exclusive rights in a material.
