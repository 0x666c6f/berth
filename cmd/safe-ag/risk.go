package main

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

	"github.com/0x666c6f/safe-agentic/pkg/config"
	"github.com/0x666c6f/safe-agentic/pkg/policy"
	"github.com/0x666c6f/safe-agentic/pkg/risk"
	"github.com/0x666c6f/safe-agentic/pkg/vmexec"
	"github.com/0x666c6f/safe-agentic/pkg/worktrees"
)

func spawnRiskInput(opts SpawnOpts, resolved spawnResolved) risk.SpawnInput {
	networkName := resolved.NetworkName
	if networkName == "" {
		networkName = opts.Network
	}
	return risk.SpawnInput{
		SSH:               opts.SSH,
		ReuseAuth:         opts.ReuseAuth,
		ReuseGHAuth:       opts.ReuseGHAuth,
		SeedAuth:          opts.SeedAuth,
		AWSProfile:        opts.AWSProfile,
		Docker:            opts.DockerAccess,
		DockerSocket:      opts.DockerSocket,
		AllowSetupScripts: opts.AllowSetupScripts,
		AutoTrust:         opts.AutoTrust,
		NetworkMode:       resolved.NetworkMode,
		NetworkName:       networkName,
	}
}

func printSpawnRiskSummary(w io.Writer, opts SpawnOpts, resolved spawnResolved) {
	notices := risk.SpawnNotices(spawnRiskInput(opts, resolved))
	if len(notices) == 0 && !opts.DryRun {
		return
	}
	fmt.Fprintln(w, "Security context:")
	if len(notices) == 0 {
		fmt.Fprintln(w, "  default: ephemeral auth, managed network, no SSH/AWS/Docker")
		return
	}
	for _, notice := range notices {
		fmt.Fprintf(w, "  ! %s: %s\n", notice.Flag, notice.Summary)
	}
	fmt.Fprintln(w, "  Guard: use ~/.safe-ag/rules.toml or .safe-ag/rules.toml to deny modes you never want.")
}

func printDiagnoseSpawnDefaults(w io.Writer, cfg config.Config, source string) {
	opts := SpawnOpts{
		SSH:          cfg.Defaults.SSH,
		ReuseAuth:    cfg.Defaults.ReuseAuth,
		ReuseGHAuth:  cfg.Defaults.ReuseGHAuth,
		SeedAuth:     cfg.Defaults.SeedAuth,
		DockerAccess: cfg.Defaults.Docker,
		DockerSocket: cfg.Defaults.DockerSocket,
	}
	resolved := spawnResolved{
		NetworkMode: policy.NetworkManaged,
		NetworkName: policy.NetworkManaged,
	}
	if cfg.Defaults.Network == policy.NetworkNone {
		resolved.NetworkMode = policy.NetworkNone
		resolved.NetworkName = policy.NetworkNone
	} else if cfg.Defaults.Network != "" && cfg.Defaults.Network != policy.NetworkManaged {
		resolved.NetworkMode = "custom"
		resolved.NetworkName = cfg.Defaults.Network
	}
	notices := risk.SpawnNotices(spawnRiskInput(opts, resolved))
	fmt.Fprintln(w)
	fmt.Fprintln(w, "Spawn defaults")
	if source != "" {
		fmt.Fprintf(w, "  config: %s\n", source)
	}
	if len(notices) == 0 {
		fmt.Fprintln(w, "  OK: default spawns use ephemeral auth, managed network, no SSH/AWS/Docker")
		return
	}
	for _, notice := range notices {
		fmt.Fprintf(w, "  ! %s enabled by default: %s\n", notice.Flag, notice.Summary)
	}
	fmt.Fprintln(w, "  Tip: override once with --no-* flags, or enforce hard policy in ~/.safe-ag/rules.toml.")
}

func worktreeCandidatePath(containerName, requestedPath string) (string, error) {
	path := requestedPath
	if path == "" {
		path = worktrees.DefaultPath(containerName)
	}
	abs, err := filepath.Abs(path)
	if err != nil {
		return "", fmt.Errorf("resolve worktree path: %w", err)
	}
	return abs, nil
}

func rejectKnownMaskedWorktreePath(path string) error {
	clean := filepath.Clean(path)
	for _, prefix := range []string{"/Users", "/Volumes", "/private", "/mnt/mac"} {
		if clean == prefix || strings.HasPrefix(clean, prefix+"/") {
			return fmt.Errorf("--worktree path %s is hidden from the safe-agentic VM by hardening; use --repo for a container clone or choose a VM-visible workspace path", clean)
		}
	}
	return nil
}

func validateWorktreeMountPath(path string) error {
	if strings.ContainsAny(path, ",\n\r\x00") {
		return fmt.Errorf("--worktree path %q contains characters Docker --mount cannot safely encode", path)
	}
	return nil
}

func ensureWorktreeParentVisibleInVM(ctx context.Context, exec vmexec.Executor, path string, dryRun bool) error {
	if dryRun {
		return nil
	}
	parent := filepath.Dir(path)
	if err := os.MkdirAll(parent, 0o755); err != nil {
		return fmt.Errorf("create worktree parent: %w", err)
	}
	marker, err := os.CreateTemp(parent, ".safe-ag-vm-visible-*")
	if err != nil {
		return fmt.Errorf("create worktree visibility marker: %w", err)
	}
	markerPath := marker.Name()
	_ = marker.Close()
	defer os.Remove(markerPath)

	if _, err := exec.Run(ctx, "test", "-f", markerPath); err != nil {
		return fmt.Errorf("--worktree parent %s is not visible inside VM %s; use --repo for a container clone or choose a VM-visible workspace path", parent, configuredVMName())
	}
	return nil
}
