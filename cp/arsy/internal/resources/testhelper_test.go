package resources

import (
	"context"
	"os"

	"github.com/isrockfeel/moonwitness/cp/arsy/internal/host"
)

func writeTestFile(path, content string) error {
	return os.WriteFile(path, []byte(content), 0o644)
}

func readTestFile(path string) (string, error) {
	data, err := os.ReadFile(path)
	return string(data), err
}

// recordingRunner records every command executed.
type recordingRunner struct {
	commands []host.Command
}

func (r *recordingRunner) Run(_ context.Context, cmd host.Command) (host.Result, error) {
	r.commands = append(r.commands, cmd)
	return host.Result{}, nil
}

func (r *recordingRunner) LookPath(_ string) bool { return true }

