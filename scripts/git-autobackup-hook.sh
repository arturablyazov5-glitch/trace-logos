#!/usr/bin/env bash
# PreToolUse-хук на Bash: перед git-командой, способной отбросить
# незакоммиченные изменения (checkout -- <path>, checkout ., restore,
# reset --hard, clean -f), делает снапшот рабочего дерева в git — тег
# autosave/<timestamp>, который ничем не мешает обычной работе и не
# попадает в git log --oneline (это не ветка, не HEAD).
#
# Инцидент 2026-07-31: незакоммиченные правки в logos/categories/*.json
# (десятки логотипов) исчезли из-за checkout/restore поверх рабочей копии —
# без --hard, без следа в reflog. Восстановили только благодаря
# source.tgz в старом деплое Vercel — случайно уцелевшей копии на
# стороннем сервисе. Хук существует, чтобы в следующий раз не зависеть от
# везения: снапшот кладём ДО того, как git-команда что-то отбросит.
#
# Никогда не блокирует команду — только страхует. Если снапшот не удался
# (не git-репозиторий, нечего сохранять), хук молча пропускает шаг.
set -uo pipefail

input=$(cat)
cmd=$(echo "$input" | jq -r '.tool_input.command // empty' 2>/dev/null)
[ -z "$cmd" ] && exit 0

# checkout -- <path> / checkout . / checkout HEAD -- ...   — отбрасывает tracked
# restore [<path>]                                          — то же самое (замена checkout)
# reset --hard | reset --hard <ref>                         — откатывает HEAD и рабочее дерево
# clean -f | -fd | -fx | -fdx                                — удаляет untracked
if ! echo "$cmd" | grep -qE '(^|[;&|]\s*)git\s+(checkout\s+(--(\s|$)|\.\s*($|[;&|])|[A-Za-z0-9_./-]+\s+--\s)|restore(\s|$)|reset\s+[^\n]*--hard|clean\s+[^\n]*-[a-z]*f)'; then
  exit 0
fi

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

ts=$(date +%Y%m%d-%H%M%S)
msg=""

# 1. Отслеживаемые файлы: git stash create делает коммит-объект с текущим
#    состоянием индекса+рабочего дерева, НЕ трогая ни то, ни другое —
#    безопасно вызывать перед любой git-командой.
if [ -n "$(git status --porcelain --untracked-files=no 2>/dev/null)" ]; then
  snap=$(git stash create "autosave: pre-command $ts" 2>/dev/null)
  if [ -n "$snap" ]; then
    git tag "autosave/$ts" "$snap" 2>/dev/null && \
      msg="🔒 Автобэкап рабочего дерева: git show autosave/$ts (файлы: git checkout autosave/$ts -- <path>)"
  fi
fi

# 2. Неотслеживаемые файлы страдают только от `clean` — stash create их не
#    видит в принципе. Кладём архивом в .git (в индекс не попадает).
if echo "$cmd" | grep -qE '(^|[;&|]\s*)git\s+clean\s+[^\n]*-[a-z]*f'; then
  untracked=$(git ls-files --others --exclude-standard)
  if [ -n "$untracked" ]; then
    backup_dir="$(git rev-parse --git-dir)/autosave-untracked"
    mkdir -p "$backup_dir"
    archive="$backup_dir/$ts.tar.gz"
    echo "$untracked" | tar -czf "$archive" -T - 2>/dev/null && \
      msg="${msg:+$msg | }📦 Untracked-файлы перед clean: $archive"
  fi
fi

[ -n "$msg" ] && printf '{"systemMessage": %s}' "$(echo "$msg" | jq -Rs .)"
exit 0
