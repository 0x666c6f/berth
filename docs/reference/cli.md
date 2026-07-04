# CLI Reference

This page is the exhaustive command reference for `safe-ag` as it exists today.

Conventions used below:
- `<required>` means a required positional argument
- `[optional]` means an optional positional argument
- `--latest` means "target the most recently started container"

## Top-level

```bash
safe-ag [command]
safe-ag [command] --help
```

Global flags:

| Flag | Meaning |
|---|---|
| `-h`, `--help` | show help |
| `-v`, `--version` | print version |

Top-level commands:

| Command | Purpose |
|---|---|
| `action` | run configured project or user actions inside agents |
| `attach` | attach to an agent tmux session |
| `audit` | show audit log entries |
| `aws-refresh` | refresh AWS credentials in a running container |
| `browser` | capture browser verification artifacts |
| `checkpoint` | manage workspace snapshots |
| `cleanup` | remove containers, networks, and optional auth volumes |
| `config` | manage persistent defaults |
| `cost` | estimate API cost from session data |
| `cron` | manage scheduled jobs |
| `diagnose` | run environment health checks |
| `diff` | show git diff from an agent workspace |
| `fleet` | spawn agents from a fleet manifest |
| `handoff` | copy or locate an agent workspace for handoff |
| `inbox` | show events that may need attention |
| `list` | list agent containers |
| `logs` | show session conversation logs |
| `mcp-login` | authenticate an MCP service |
| `output` | show agent output or derived views |
| `peek` | show the latest visible output |
| `pipeline` | run staged pipelines |
| `pr` | create a GitHub PR from agent work |
| `pr-fix` | fix review feedback on the current or given PR |
| `pr-review` | run a one-shot PR review workflow |
| `profile` | run reusable agent profiles |
| `replay` | replay a session event log |
| `retry` | retry a failed agent with the same config |
| `review` | run an AI review over the diff |
| `review-comments` | store local file/line review comments |
| `run` | quick-start wrapper around `spawn` |
| `search` | search agent session logs |
| `server` | serve safe-agentic state over JSON protocol |
| `sessions` | export session data |
| `setup` | initialize VM and build the image |
| `spawn` | start a new agent container |
| `status` | show live agent state (blocked/working/done/idle/exited) |
| `steer` | send a follow-up message into an agent tmux session |
| `stop` | stop agent containers |
| `summary` | show a compact agent summary |
| `template` | manage prompt templates |
| `timeline` | show recent events and audit entries |
| `todo` | manage merge-gate todos |
| `tui` | launch the terminal UI |
| `update` | rebuild the image |
| `vm` | manage the Apple container machine |
| `workspace` | stage, unstage, or revert files in an agent workspace |
| `worktree` | manage host worktrees created by `--worktree` |

## Container-targeting convention

Many commands take one of these forms:

```bash
safe-ag <command> <name>
safe-ag <command> --latest
```

`<name>` may be a full container name or a unique substring. Ambiguous substrings fail and print the matching container names.

Commands in this family:
- `attach`
- `aws-refresh`
- `cost`
- `diff`
- `logs`
- `output`
- `peek`
- `pr`
- `replay`
- `retry`
- `review`
- `sessions`
- `status`
- `stop`
- `summary`
- most `checkpoint` and `todo` subcommands

## `spawn`

Usage:

```bash
safe-ag spawn <claude|codex|shell> [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--auto-trust` | bool | skip the trust prompt |
| `--aws` | string | AWS profile for credential injection |
| `--background` | bool | run detached instead of attaching |
| `--allow-setup-scripts` | bool | allow repo-provided `safe-agentic.json` setup hooks |
| `--cpus` | string | CPU limit |
| `--docker` | bool | enable Docker-in-Docker |
| `--docker-socket` | bool | mount the VM Docker socket directly |
| `--dry-run` | bool | print the resolved launch command only; sensitive env and labels are redacted |
| `--ephemeral-auth` | bool | use a per-container auth volume |
| `--fleet-volume` | string | shared fleet volume name |
| `--identity` | string | git identity in `Name <email>` form |
| `--instructions` | string | task instructions |
| `--instructions-file` | string | read instructions from a file |
| `--max-cost` | string | kill if estimated cost exceeds this budget |
| `--memory` | string | memory limit, e.g. `8g` |
| `--name` | string | explicit container name suffix |
| `--no-docker` | bool | disable default Docker-in-Docker |
| `--no-docker-socket` | bool | disable default host Docker socket |
| `--no-reuse-auth` | bool | disable default shared auth volume |
| `--no-reuse-gh-auth` | bool | disable default GitHub CLI auth reuse |
| `--no-seed-auth` | bool | disable default host auth seeding |
| `--no-ssh` | bool | disable default SSH agent forwarding |
| `--network` | string | custom Docker network |
| `--notify` | string | notification targets, comma-separated (see [Notify targets](#notify-targets)) |
| `--on-complete` | string | command to run on success |
| `--on-exit` | string | command to run on exit |
| `--on-fail` | string | command to run on failure |
| `--pids-limit` | int | PIDs limit, minimum 64 |
| `--prompt` | string | initial prompt |
| `--repo` | strings | repository URL to clone; repeatable |
| `--reuse-auth` | bool | reuse shared auth volume |
| `--reuse-gh-auth` | bool | reuse GitHub CLI auth |
| `--seed-auth` | bool | copy host Claude/Codex auth into this session |
| `--ssh` | bool | enable SSH agent forwarding |
| `--template` | string | prompt template name |
| `--var` | strings | template variable assignment `key=value`; repeatable |
| `--worktree` | bool | create and mount a managed git worktree from the current checkout |
| `--worktree-branch` | string | branch name for `--worktree` |
| `--worktree-include` | string | include file for ignored local files; default `.safe-aginclude` |
| `--worktree-path` | string | destination path for `--worktree` |

Worktree mode:

```bash
safe-ag spawn claude --worktree --name auth-fix --prompt "Fix auth tests"
```

`--worktree` must run from inside a git checkout and cannot be combined with `--repo`. It creates a branch under `safe-ag/<container>` by default, bind-mounts that checkout at `/workspace`, and copies ignored local files listed in `.safe-aginclude`.

**`--worktree` is opt-in and off by default.** Apple's `container` cannot mount an arbitrary host directory into a machine — the only host share is `--home-mount ro|rw|none`, and safe-agentic defaults to `none` (nothing shared, strongest isolation). To use `--worktree` you must enable the worktree mount:

```bash
safe-ag setup --enable-worktrees      # or: safe-ag config set defaults.worktrees_mount true && safe-ag setup
```

This switches the machine to `home-mount=rw` and, via `vm/setup.sh`, binds *only* the worktrees root — `~/.safe-ag/worktrees` by default, or `defaults.worktrees_dir` (must be under your home) — to a stable `/worktrees`, then **detaches** the rest of the home share and tmpfs-masks `/Users`, `/Volumes`, `/private`, and `/mnt/mac`. On spawn, the host worktree path is translated to its in-VM `/worktrees/...` path for the Docker bind. A `--worktree-path` outside the worktrees root is rejected before launch.

Disable again with `safe-ag setup --disable-worktrees` (restores `home-mount=none`). `safe-ag setup` and `safe-ag vm start` reconcile the machine to match the config in either direction; `safe-ag diagnose` reports the current posture.

**Security trade-off:** enabling the worktree mount **weakens the VM boundary**. `home-mount=rw` shares your whole home with the machine at the virtiofs level; safe-agentic detaches and masks everything except the worktrees root, but a VM-root compromise or Docker escape could re-reach host home — the default `home-mount=none` shares nothing and cannot. Keep secrets and unrelated projects out of the worktrees root. See [Threat model](../security/threat-model.md).

Spawn policy:

```toml
# ~/.safe-ag/rules.toml or .safe-ag/rules.toml
[allow]
docker_modes = ["off", "dind"]
networks = ["managed"]
aws_profiles = ["dev"]
ssh = false
reuse_auth = false
reuse_gh_auth = false
seed_auth = false
setup_scripts = false
```

Policy is enforced after config defaults are applied and before network/container creation. User and nearest project rules both apply; any deny blocks the spawn. Omitted keys are unrestricted.

### Notify targets

`--notify` takes a comma-separated list of targets. The whole string is
persisted (base64) on the container and reconstructed for later delivery.

| Target | Form | Delivery |
|---|---|---|
| `terminal` | `terminal` | print to the terminal |
| `slack` | `slack:<webhook-url>` | POST to a Slack incoming webhook |
| `command` | `command:<path>` | run an executable with the event |
| `system` | `system` | native macOS notification |

The `system` target posts a macOS notification titled `safe-ag: <container>`
via `terminal-notifier` when it is on `PATH`, otherwise via
`osascript -e 'display notification …'`. The sound conveys severity:
attention-worthy events (`blocked`, `failed`, `needs-auth`, `stuck`) play a
harsh sound (`Basso`); successful ones (`ready-for-review`, `ready-for-pr`,
`done`) play a soft sound (`Glass`); everything else is silent. On non-macOS
hosts the `system` target is a no-op.

Example:

```bash
safe-ag spawn claude --notify terminal,system --repo git@github.com:org/repo.git
```

## `run`

Usage:

```bash
safe-ag run <repo-url> [repo-url...] [prompt] [flags]
```

`run` is a convenience wrapper around `spawn`.

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--allow-setup-scripts` | bool | allow repo-provided `safe-agentic.json` setup hooks |
| `--background` | bool | run detached |
| `--cpus` | string | CPU limit |
| `--dry-run` | bool | print the resolved launch command only; sensitive env and labels are redacted |
| `--instructions` | string | task instructions |
| `--max-cost` | string | cost budget |
| `--no-docker` | bool | disable default Docker-in-Docker |
| `--no-docker-socket` | bool | disable default host Docker socket |
| `--no-reuse-auth` | bool | disable default shared auth volume |
| `--no-reuse-gh-auth` | bool | disable default GitHub CLI auth reuse |
| `--no-seed-auth` | bool | disable default host auth seeding |
| `--no-ssh` | bool | disable default SSH agent forwarding |
| `--memory` | string | memory limit |
| `--name` | string | container name |
| `--network` | string | custom Docker network |
| `--seed-auth` | bool | copy host Claude/Codex auth into this session |
| `--template` | string | prompt template |
| `--var` | strings | template variable assignment `key=value`; repeatable |

## `list`

Usage:

```bash
safe-ag list [flags]
```

The human-readable output includes a **STATE** column next to each agent —
the same `agentstate` classification used by `safe-ag status` and the TUI
(`blocked` / `working` / `done` / `idle` / `exited`). Running tmux agents are
detected from their live pane; stopped containers map to `done` (clean exit) or
`exited` (non-zero) by exit code.

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--json` | bool | output raw JSON-like line format from Docker listing |

With `--json`, each Docker line gains an added `"state"` field. All existing
Docker fields are preserved unchanged, so the output stays backward compatible.

## `action`

Usage:

```bash
safe-ag action list
safe-ag action show <name>
safe-ag action run <name> [agent|--latest]
```

Actions are loaded from `~/.safe-ag/actions.toml`, then `.safe-ag/actions.toml` in the current directory. Project actions override user actions with the same name.

Schema:

```toml
[actions.test]
description = "Run unit tests"
command = "go test ./..."

[actions.lint]
command = "npm run lint"
cwd = "frontend"
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--file` | strings | additional actions.toml file; repeatable |
| `--latest` | bool | for `action run`, target the latest container |

## `profile`

Usage:

```bash
safe-ag profile list
safe-ag profile show <name>
safe-ag profile run <name> [prompt]
```

Profiles are loaded from `~/.safe-ag/agents/*.toml`, then `.safe-ag/agents/*.toml` in the current directory. Project profiles override user profiles with the same name.

Schema:

```toml
agent_type = "codex"
repo = ["git@github.com:org/repo.git"]
container_name = "reviewer"
prompt = "Review this repo and report actionable issues"
ssh = true
reuse_auth = true
reuse_gh_auth = true
background = true
```

Useful fields mirror spawn flags: `template`, `template_vars`, `instructions`, `network`, `memory`, `cpus`, `pids_limit`, `aws`, `max_cost`, `docker`, `docker_socket`, `seed_auth`, `auto_trust`, and lifecycle callbacks.

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--dir` | strings | additional profile directory; repeatable |
| `--dry-run` | bool | for `profile run`, show the resolved spawn command |

## `search`

Usage:

```bash
safe-ag search <query> [agent|--latest]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--case-sensitive` | bool | use case-sensitive matching |
| `--latest` | bool | target the latest container |
| `--lines` | int | session lines to scan per agent; default `500` |

## `server`

Usage:

```bash
safe-ag server --stdio
SAFE_AGENTIC_SERVER_TOKEN=secret safe-ag server --listen 127.0.0.1:8765
```

Reads newline-delimited JSON requests from stdin and writes JSON responses to stdout. With `--listen`, accepts authenticated `POST /rpc` requests with `Authorization: Bearer <token>`. HTTP listen addresses must be loopback-only (`localhost`, `127.0.0.1`, or `::1`).

Methods: `schema`, `ping`, `timeline`, `inbox`, `agents.list`, `agent.logs`, `agent.diff`, `actions.list`, and `actions.run`.

Example:

```json
{"jsonrpc":"2.0","id":1,"method":"timeline","params":{"lines":20}}
```

## `browser`

Usage:

```bash
safe-ag browser capture <url> [--mode auto|http|chrome] [--annotation NOTE] [--out DIR] [--timeout 30s]
```

Captures browser artifacts under `~/.safe-ag/state/browser/<timestamp>` by default. `http` mode captures DOM and headers. `chrome` mode uses headless Chrome/CDP to capture DOM, screenshot, console, and network artifacts. `--annotation` writes notes into `annotations.json` for handoff to agents. `auto` tries Chrome when available, then falls back to HTTP. It does not mount or reuse host browser profiles or cookies.

## `attach`

Usage:

```bash
safe-ag attach <name|--latest> [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--latest` | bool | target the latest container |
| `--resume` | bool | continue the agent's previous conversation instead of starting a fresh session |

With `--resume`, the agent continues in continue mode (`claude --continue` /
`codex resume --last`) rather than a fresh prompt. If the container is still
running with a live session, `attach --resume` simply reconnects to the ongoing
conversation. If it exited, the container is restarted and the entrypoint
resumes automatically. If it is running but has no attachable tmux session,
`attach --resume` **refuses** rather than relaunch — a headless agent (e.g.
`--background`) may still be alive, and starting a second agent against the same
workspace and auth volume would be unsafe; use `safe-ag steer` to send input, or
`safe-ag stop` then `attach --resume` to restart. Resume works only when the
conversation transcript survived: it lives under `~/.claude` / `~/.codex`, so a
session that used `--ephemeral-auth` (tmpfs) loses its transcript once the
container stops — on a stopped ephemeral container `attach --resume` **refuses**
(restarting would auto-continue against an empty auth dir and error), so use
plain `safe-ag attach <name>` or `safe-ag retry` for a fresh run. Use
`--reuse-auth` (a persistent named volume) if you want conversations to survive
stops. `--resume` supports claude and codex agents only.

## `steer`

Usage:

```bash
safe-ag steer <name|--latest> "follow-up message"
```

If the target container is stopped, `steer` starts it first and waits for the tmux session.

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--latest` | bool | target the latest container |

## `peek`

Usage:

```bash
safe-ag peek [name|--latest] [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--latest` | bool | target the latest container |
| `--lines` | int | number of lines to show; default `30` |

## `logs`

Usage:

```bash
safe-ag logs [name|--latest] [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--follow`, `-f` | bool | follow log output |
| `--latest` | bool | target the latest container |
| `--lines` | int | number of log entries; default `50` |

## `status`

Reports the live state of an agent inferred from its tmux pane: `blocked`
(waiting on a permission / trust / approval prompt or an interactive login),
`working` (actively streaming), `idle` (sitting at an empty prompt), `done`
(stopped, exit 0), `exited` (stopped, non-zero), or `unknown`. Detection is
deliberately conservative about `blocked` — a false positive is worse than a
miss — so ambiguous panes resolve to `working` or `unknown` rather than
`blocked`.

Usage:

```bash
safe-ag status [name|--latest] [flags]
safe-ag status --all
safe-ag status agent-foo --json
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--all` | bool | show every safe-agentic container |
| `--json` | bool | output as JSON |
| `--latest` | bool | target the latest container |

A blocked agent also surfaces in [`inbox`](#inbox) as a needs-attention item,
and can drive the [`system` notify target](#notify-targets).

## `summary`

Usage:

```bash
safe-ag summary [name|--latest] [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--latest` | bool | target the latest container |

The summary includes a `State:` line with the same detection used by
[`status`](#status).

## `output`

Usage:

```bash
safe-ag output [name|--latest] [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--commits` | bool | show git commit log |
| `--diff` | bool | show git diff |
| `--files` | bool | show changed files |
| `--json` | bool | emit JSON |
| `--latest` | bool | target the latest container |

## `diff`

Usage:

```bash
safe-ag diff [name|--latest] [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--stat` | bool | show diffstat only |
| `--side-by-side`, `-s` | bool | render the diff side-by-side with `delta` (baked into the agent image) |

`--stat` and `--side-by-side` are mutually exclusive. `--side-by-side` sizes delta's columns to the host terminal width (falls back to `$COLUMNS`, then 160). If `delta` is missing from an older agent image, it prints a one-line warning to stderr and falls back to a plain diff.

## `review`

Usage:

```bash
safe-ag review [name|--latest] [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--base` | string | base branch for diff; default `main` |

The review prompt requires every finding to carry a risk tag (`[HIGH]`, `[MEDIUM]`, or `[LOW]`) with a `file:line` location, and a closing `VERDICT:` line. After the raw review text, `safe-ag review` prints a grouped HIGH → LOW summary (untagged findings are kept under `UNTAGGED`, never dropped) followed by the verdict.

## `review-comments`

Usage:

```bash
safe-ag review-comments list [agent|--latest]
safe-ag review-comments add [agent|--latest] <file> <line> <body>
safe-ag review-comments resolve <id>
safe-ag review-comments clear <agent|--latest>
```

Comments are stored locally in `~/.safe-ag/state/review-comments.jsonl`. Use them to keep file/line review notes attached to an agent while you steer fixes or prepare handoff.

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--all` | bool | for `list`, include resolved comments |
| `--file` | string | override the review-comments storage file |
| `--latest` | bool | target the latest container |

## `handoff`

Usage:

```bash
safe-ag handoff <agent|--latest> --to-local ./workspace-copy
safe-ag handoff <agent|--latest> --to-worktree
```

`--to-local` copies `/workspace` out of the container. `--to-worktree` prints the managed host worktree path for agents spawned with `--worktree`.

## `workspace`

Usage:

```bash
safe-ag workspace stage <agent|--latest> <path...>
safe-ag workspace unstage <agent|--latest> <path...>
safe-ag workspace revert <agent|--latest> <path...> --yes
safe-ag workspace stage-patch <agent|--latest> selected.patch
safe-ag workspace revert-patch <agent|--latest> selected.patch --yes
```

Paths must stay relative to the workspace. `revert` and `revert-patch` discard changes and require `--yes` when stdin is not interactive. Patch commands accept selected hunks from a normal unified diff and reject workspace-escaping paths.

## `worktree`

Usage:

```bash
safe-ag worktree list
safe-ag worktree snapshot <agent|--latest> [label]
safe-ag worktree restore <agent|--latest> <stash-ref>
safe-ag worktree cleanup [--dry-run] [--all]
```

`list` reads `~/.safe-ag/state/worktrees.jsonl`. `snapshot` and `restore` operate on the git worktree attached to an agent. `cleanup` drops missing registry entries by default; `--all` also removes registered worktrees with `git worktree remove --force`.

## `timeline`

Usage:

```bash
safe-ag timeline
```

Shows recent events from `~/.safe-ag/state/events.jsonl` and audit entries from `~/.safe-ag/state/audit.jsonl`.

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--lines` | int | number of recent entries; default `50` |

## `inbox`

Usage:

```bash
safe-ag inbox
safe-ag inbox --all
```

Shows events likely to need attention, such as failed cron jobs or entries marked `needs-auth`, `blocked`, `stuck`, `failed-tests`, `ready-for-review`, or `ready-for-pr`. In addition to logged events, `inbox` sweeps running agents live and adds a `blocked` item for any agent currently waiting on a prompt.

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--all` | bool | include informational entries |

## `pr`

Usage:

```bash
safe-ag pr [name|--latest] [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--base` | string | base branch; default `main` |
| `--title` | string | PR title |

## `retry`

Usage:

```bash
safe-ag retry <name|--latest> [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--feedback` | string | additional guidance appended to the retry prompt (or, with `--resume`, sent as a follow-up message) |
| `--resume` | bool | continue the source conversation instead of re-running the original prompt |

By default `retry` reconstructs the original spawn options into a fresh
container and re-injects the prompt. With `--resume`, it instead reuses the
source container's exact session/auth volume by restarting that container in
continue mode, so the prior conversation is preserved. When combined with
`--feedback`, the feedback text is delivered as a follow-up message through the
same input path as `steer` (rather than appended to the prompt). If the source
session used `--ephemeral-auth`, its transcript did not survive the stop and
`retry --resume` fails with an actionable error — retry without `--resume` for a
fresh attempt, or re-run the task with `--reuse-auth` so future sessions
persist. If the source container is still running but has no live tmux session
(a headless agent may still be active), `retry --resume` refuses rather than
risk a second agent — use `safe-ag steer`, or `safe-ag stop` it first.
`--resume` supports claude and codex agents only.

## `replay`

Usage:

```bash
safe-ag replay [name|--latest] [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--latest` | bool | target the latest container |
| `--tools-only` | bool | show only tool calls |

## `sessions`

Usage:

```bash
safe-ag sessions [name|--latest] [dest] [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--latest` | bool | target the latest container |

## `aws-refresh`

Usage:

```bash
safe-ag aws-refresh [name|--latest] [profile] [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--latest` | bool | target the latest container |

## `cost`

Usage:

```bash
safe-ag cost [name|--latest] [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--history` | string | show historical costs, e.g. `7d`, `30d` |
| `--latest` | bool | target the latest container |

## `audit`

Usage:

```bash
safe-ag audit [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--lines` | int | number of entries to show; default `50` |

## `checkpoint`

Subcommands:

### `checkpoint create`

```bash
safe-ag checkpoint create <name|--latest> [label]
```

### `checkpoint list`

```bash
safe-ag checkpoint list <name|--latest>
```

### `checkpoint restore`

```bash
safe-ag checkpoint restore <name|--latest> <ref>
```

No additional flags beyond `--help`.

## `todo`

Subcommands:

### `todo add`

```bash
safe-ag todo add <name|--latest> <text>
```

### `todo list`

```bash
safe-ag todo list <name|--latest>
```

### `todo check`

```bash
safe-ag todo check <name|--latest> <index>
```

### `todo uncheck`

```bash
safe-ag todo uncheck <name|--latest> <index>
```

No additional flags beyond `--help`.

## `fleet`

Usage:

```bash
safe-ag fleet <manifest.yaml> [flags]
safe-ag fleet status
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--dry-run` | bool | print what would run without executing |
| `--repo` | strings | default repo URL for agents missing `repo` or `repos` |
| `--var` | strings | manifest variable assignment `key=value`; repeatable |

Subcommands:

### `fleet status`

```bash
safe-ag fleet status
```

## `pipeline`

Usage:

```bash
safe-ag pipeline <pipeline.yaml|name> [flags]
safe-ag pipeline list
safe-ag pipeline show <name>
safe-ag pipeline inspect <name>
safe-ag pipeline render <name>
safe-ag pipeline validate <name>
safe-ag pipeline create <name>
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--background` | bool | run the pipeline in the background and return immediately |
| `--dry-run` | bool | print the execution plan without running |
| `--repo` | strings | default repo URL for agents missing `repo` or `repos` |
| `--var` | strings | manifest variable assignment `key=value`; repeatable |

Saved user pipelines live in `~/.safe-ag/pipelines/`. Built-in review presets ship under the same catalog surface.

### Judge stages (best-of-N "crown")

A pipeline stage can select the single best result among two or more candidate
runs instead of spawning an agent of its own. Add a `judge` block to a step
(flat form) or stage (stages form). The judge depends on the candidate stages,
collects each candidate container's working-tree diff and final message, runs a
one-shot Claude judge to pick a winner, and records a strict-JSON verdict.

```yaml
name: judge-fanout
defaults:
  repo: ${repo}
  ssh: true
  reuse_auth: true
  auto_trust: true
steps:
  - name: implement            # fan out across engines → 2 candidates
    models: [claude, codex]
    prompt: "${task}\n\nYou are candidate ${model}. Commit focused, tested changes."
  - name: pick-winner
    judge:
      criteria: "correctness and tests first, then minimal diff"  # optional
      auto_pr: true                                               # optional (default false)
      base: main                                                  # optional PR base (default main)
    depends_on: implement
```

Judge block fields:

| Field | Type | Meaning |
|---|---|---|
| `criteria` | string | optional free-text ranking guidance; a quality-first default is used when empty |
| `auto_pr` | bool | when true, open a GitHub PR from the winning container (default false) |
| `base` | string | PR base branch used with `auto_pr` (default `main`) |
| `max_diff` | int | per-candidate diff byte cap embedded in the judge prompt (default 12000; truncation is noted inline) |

Rules (validated at parse time):

- A judge stage must `depends_on` stages that collectively produce **at least
  two** candidate runs. Fan out either with `models: [...]` on the parent step/
  stage, or with two or more `agents:` in a single candidate stage.
- A judge stage/step must **not** carry `prompt`, `template`, `repo`, `type`,
  `instructions`, `profile`, `models`, or `agents` of its own.
- A judge cannot depend on a sub-pipeline stage or on another judge stage.

Notes on candidate fan-out: `models: [...]` expands one step/stage into one
candidate container **per entry**, and each entry becomes that candidate's agent
`type` — so today the practical values are the agent engines `claude` and
`codex` (per-model selection like `opus`/`sonnet` is future work). A single
stage listing two or more `agents:` is the other way to reach ≥2 candidates.

The judge agent is instructed to emit exactly:

```json
{"winner":"<container-name>","reason":"...","summary":"<PR-style summary of the winning change>"}
```

The verdict is parsed leniently (the first well-formed JSON object whose
`winner` is a real candidate wins), printed at pipeline end, and persisted to
`~/.safe-ag/state/judge/<pipeline>-<stage>-<timestamp>.json`. If the judge
produces no usable verdict, the stage fails and the raw judge output is saved to
that same file for inspection.

With `auto_pr: true`, safe-ag opens a PR from the winning candidate. The winner
container has already exited by then; safe-ag does **not** restart it (that would
re-run its agent and could mutate the workspace). Instead it launches a
short-lived helper container that mounts the winner's volumes with
`--volumes-from` (carrying `/workspace` and the gh auth volume) but overrides the
entrypoint. The helper creates a dedicated head branch
(`safe-ag/judge-<pipeline>-<stage>-<timestamp>`) from the candidate's committed
work — never the cloned default branch — pushes it, and opens the PR (base
`base`, body = the judge summary with the reason appended).

Because SSH-agent auth is per-container and cannot reach the helper, **`auto_pr`
requires the winning candidate to have GitHub HTTPS auth** — spawn candidates
with `reuse_gh_auth: true`. Candidates that can only push over SSH will fail the
push, and the helper surfaces a clear error. A PR failure is always reported as a
warning without discarding the verdict.

See `examples/pipeline-judge-fanout.yaml` for a complete runnable manifest.

## `config`

Subcommands:

### `config show`

```bash
safe-ag config show
```

Reads `~/.safe-ag/config.toml`.
Set `SAFE_AGENTIC_CONFIG_HOME` to read from another safe-agentic config home
without changing the process `HOME`.

### `config get`

```bash
safe-ag config get <key>
```

Examples:

```bash
safe-ag config get defaults.memory
safe-ag config get SAFE_AGENTIC_DEFAULT_MEMORY
```

### `config set`

```bash
safe-ag config set <key> <value>
```

Examples:

```bash
safe-ag config set defaults.memory 16g
safe-ag config set defaults.identity "Your Name <you@example.com>"
```

### `config reset`

```bash
safe-ag config reset <key>
```

No additional flags beyond `--help`.

## `template`

Subcommands:

### `template list`

```bash
safe-ag template list
```

User templates live in `~/.safe-ag/templates/`.

### `template show`

```bash
safe-ag template show <name>
```

### `template render`

```bash
safe-ag template render <name>
```

### `template create`

```bash
safe-ag template create <name>
```

No additional flags beyond `--help`.

## `pipeline` saved catalog

Saved user pipelines live in `~/.safe-ag/pipelines/`.

## `pr-review`

Usage:

```bash
safe-ag pr-review [claude|codex|dual] [pr]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--dry-run` | bool | print the resolved review pipeline without running |
| `--repo` | strings | default repo URL; inferred from current checkout when omitted |
| `--var` | strings | workflow variable assignment `key=value`; repeatable |

Behavior:
- defaults to `dual`
- infers current PR via `gh pr view --json number` when omitted
- runs one-shot review presets without the watcher loop

## `pr-fix`

Usage:

```bash
safe-ag pr-fix [pr]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--dry-run` | bool | print the resolved fix pipeline without running |
| `--repo` | strings | default repo URL; inferred from current checkout when omitted |
| `--var` | strings | workflow variable assignment `key=value`; repeatable |

## `mcp-login`

Usage:

```bash
safe-ag mcp-login <service> [container]
```

No additional flags beyond `--help`.

## `cron`

Subcommands:

### `cron add`

```bash
safe-ag cron add <name> <schedule> <command...>
```

Accepted schedule styles:
- `every 1h`
- `every 6h`
- `every 30m`
- `daily 09:00`
- standard cron expressions like `0 */6 * * *`

### `cron list`

```bash
safe-ag cron list
```

### `cron remove`

```bash
safe-ag cron remove <name>
```

### `cron enable`

```bash
safe-ag cron enable <name>
```

### `cron disable`

```bash
safe-ag cron disable <name>
```

### `cron run`

```bash
safe-ag cron run <name>
```

### `cron daemon`

```bash
safe-ag cron daemon
```

No additional flags beyond `--help`.

## `tui`

Usage:

```bash
safe-ag tui
```

No command-specific flags beyond `--help`.

See [TUI Reference](tui.md) for keybindings, modes, and interaction model.

## `setup`

Usage:

```bash
safe-ag setup
```

No command-specific flags beyond `--help`.

## `update`

Usage:

```bash
safe-ag update [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--full` | bool | full rebuild without cache |
| `--quick` | bool | bust only the AI CLI layer |

## `diagnose`

Usage:

```bash
safe-ag diagnose
```

No command-specific flags beyond `--help`.

`diagnose` also prints the effective spawn defaults from `~/.safe-ag/config.toml` and warns when defaults widen the sandbox, such as default SSH forwarding, shared auth, Docker access, setup hooks, or custom networking.

## `cleanup`

Usage:

```bash
safe-ag cleanup [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--auth` | bool | also remove shared and isolated auth volumes |

## `stop`

Usage:

```bash
safe-ag stop <name|--latest|--all> [flags]
```

Flags:

| Flag | Type | Meaning |
|---|---|---|
| `--all` | bool | stop and remove all agent containers |
| `--latest` | bool | target the latest container |

## `vm`

Subcommands:

### `vm start`

```bash
safe-ag vm start
```

### `vm stop`

```bash
safe-ag vm stop
```

### `vm ssh`

```bash
safe-ag vm ssh
```

No additional flags beyond `--help`.
