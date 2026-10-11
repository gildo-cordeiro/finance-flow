#!/usr/bin/env python3
"""Lembra, em Pull Requests, de atualizar skills e de considerar ADRs.

Lê .agents/skills/skill-maintenance/references/impact-map.json e compara com os arquivos alterados.
Não bloqueia o PR (sempre sai com código 0), a menos que --strict seja usado.

Uso:
  python3 scripts/check_skills_sync.py --base origin/main
  python3 scripts/check_skills_sync.py --files a.java b.gradle   # teste local, sem git
"""
import argparse, json, os, re, subprocess, sys

MAP_PATH = '.agents/skills/skill-maintenance/references/impact-map.json'


def glob_to_regex(pattern):
    out, i = '', 0
    while i < len(pattern):
        c = pattern[i]
        if c == '*':
            if pattern[i:i + 2] == '**':
                out += '.*'
                i += 2
                continue
            out += '[^/]*'
        elif c == '?':
            out += '[^/]'
        else:
            out += re.escape(c)
        i += 1
    return re.compile('^' + out + '$')


def matches(files, patterns):
    regs = [glob_to_regex(p) for p in patterns]
    return sorted(f for f in files if any(r.match(f) for r in regs))


def changed_files(base):
    for spec in (f'{base}...HEAD', f'{base}..HEAD'):
        r = subprocess.run(['git', 'diff', '--name-only', spec], capture_output=True, text=True)
        if r.returncode == 0:
            return [l.strip() for l in r.stdout.splitlines() if l.strip()]
    sys.exit(f'Não foi possível comparar com {base}. Use --base com uma ref existente.')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', default='origin/main')
    ap.add_argument('--files', nargs='*')
    ap.add_argument('--strict', action='store_true')
    args = ap.parse_args()

    files = args.files if args.files is not None else changed_files(args.base)
    files = [f for f in files if f != MAP_PATH]
    with open(MAP_PATH, encoding='utf-8') as fh:
        cfg = json.load(fh)

    warnings, notices, rows = [], [], []
    for entry in cfg['skills']:
        skill = entry['skill']
        hit = matches(files, entry['watch'])
        if not hit:
            continue
        skill_dir = f'.agents/skills/{skill}/'
        updated = any(f.startswith(skill_dir) for f in files) or any(f in files for f in entry.get('companions', []))
        status = 'atualizada' if updated else 'NÃO atualizada'
        rows.append((skill, status, hit))
        if not updated:
            sample = ', '.join(hit[:3]) + (' ...' if len(hit) > 3 else '')
            warnings.append((f'Skill `{skill}` pode estar desatualizada',
                             f'A PR altera arquivos que a skill descreve ({sample}) mas não altera `{skill_dir}`. '
                             f'Revise com a skill `skill-maintenance` ou justifique na PR.'))

    adr_touched = any(f.startswith('docs/adr/') for f in files)
    adr_rows = []
    for sig in cfg.get('adr_signals', []):
        hit = matches(files, sig['watch'])
        if hit:
            adr_rows.append((sig['sinal'], hit))
            if not adr_touched:
                notices.append((f"Possível decisão arquitetural: {sig['sinal']}",
                                f"Arquivos: {', '.join(hit[:3])}. Consulte o desenvolvedor sobre um ADR (skill `adr-workflow`) "
                                f"ou registre 'ADR dispensado' na PR."))

    for title, msg in warnings:
        print(f'::warning title={title}::{msg}')
    for title, msg in notices:
        print(f'::notice title={title}::{msg}')

    lines = ['## Governança: skills e ADRs (aviso, não bloqueia)', '']
    if rows:
        lines += ['| Skill | Situação | Arquivos que acionaram |', '| --- | --- | --- |']
        lines += [f"| `{s}` | {st} | {', '.join(h[:3])}{' ...' if len(h) > 3 else ''} |" for s, st, h in rows]
    else:
        lines.append('Nenhum arquivo alterado está no mapa de skills.')
    lines.append('')
    if adr_rows:
        lines.append(f"Sinais de decisão arquitetural: {'ADR já alterado nesta PR.' if adr_touched else 'nenhum ADR alterado nesta PR.'}")
        lines += [f"- {s}: {', '.join(h[:3])}" for s, h in adr_rows]
    else:
        lines.append('Sem sinais de decisão arquitetural nos arquivos alterados.')
    text = '\n'.join(lines)
    print(text)
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a', encoding='utf-8') as fh:
            fh.write(text + '\n')
    sys.exit(1 if (args.strict and warnings) else 0)


if __name__ == '__main__':
    main()
