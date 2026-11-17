package resources

import (
	"context"
	"fmt"

	"github.com/isrockfeel/moonwitness/cp/arsy/internal/host"
)

// Unsupported adalah provider pengganti untuk OS yang tidak punya backend.
// Ia gagal secara eksplisit supaya plan/apply tidak pernah "sukses diam-diam".
type Unsupported struct {
	ResourceKind string
	Reason       string
}

func (u *Unsupported) Kind() string { return u.ResourceKind }

func (u *Unsupported) ObsKey(r Resource) string { return r.ID() }

func (u *Unsupported) Validate(r Resource) error {
	return fmt.Errorf("%w: %s: %s", host.ErrUnsupported, u.ResourceKind, u.Reason)
}

func (u *Unsupported) Observe(ctx context.Context) (map[string]Observation, error) {
	return nil, fmt.Errorf("%w: %s: %s", host.ErrUnsupported, u.ResourceKind, u.Reason)
}

func (u *Unsupported) Plan(r Resource, obs Observation) (Change, error) {
	return Change{}, fmt.Errorf("%w: %s: %s", host.ErrUnsupported, u.ResourceKind, u.Reason)
}

func (u *Unsupported) Apply(ctx context.Context, r Resource) error {
	return fmt.Errorf("%w: %s: %s", host.ErrUnsupported, u.ResourceKind, u.Reason)
}

// DefaultProviders merakit provider sesuai kapabilitas host.
func DefaultProviders(runner host.Runner, info host.Info) []Provider {
	providers := []Provider{
		&Files{},
		&Dir{},
		&Docker{Runner: runner},
	}

	if info.Capabilities.Systemd {
		providers = append(providers, &Systemd{Runner: runner})
	} else {
		providers = append(providers, &Unsupported{
			ResourceKind: "systemd",
			Reason:       "systemd tidak terdeteksi (butuh /run/systemd/system)",
		})
	}

	if info.Capabilities.Docker && runner.LookPath("docker") {
		providers = append(providers, &DockerCompose{Runner: runner})
	} else {
		providers = append(providers, &Unsupported{
			ResourceKind: "dockercompose",
			Reason:       "docker compose tidak tersedia",
		})
	}

	if runner.LookPath("tar") || runner.LookPath("cp") {
		providers = append(providers, &Backup{Runner: runner})
	} else {
		providers = append(providers, &Unsupported{
			ResourceKind: "backup",
			Reason:       "tar/cp tidak tersedia",
		})
	}

	if info.Capabilities.Cert {
		providers = append(providers, &Cert{Runner: runner})
	} else {
		providers = append(providers, &Unsupported{
			ResourceKind: "cert",
			Reason:       "openssl/certbot tidak tersedia",
		})
	}

	// V1-deferred resource kinds — always unsupported in V1.
	providers = append(providers,
		&Unsupported{ResourceKind: "kubernetes", Reason: "kubernetes: tidak termasuk dalam scope v1 arsy; gunakan kubectl langsung"},
		&Unsupported{ResourceKind: "gitdeploy", Reason: "gitdeploy: digantikan oleh github actions deployment pipeline (mw-0038)"},
		&Unsupported{ResourceKind: "cron", Reason: "cron: tidak termasuk dalam scope v1; gunakan systemd timers"},
		&Unsupported{ResourceKind: "user", Reason: "user: manajemen user tidak termasuk dalam scope v1"},
		&Unsupported{ResourceKind: "firewall", Reason: "firewall: manajemen firewall tidak termasuk dalam scope v1"},
		&Unsupported{ResourceKind: "portforward", Reason: "portforward: port forwarding tidak termasuk dalam scope v1"},
		&Unsupported{ResourceKind: "network", Reason: "network: manajemen jaringan tidak termasuk dalam scope v1"},
		&Unsupported{ResourceKind: "ssh", Reason: "ssh: manajemen ssh key tidak termasuk dalam scope v1"},
		&Unsupported{ResourceKind: "mount", Reason: "mount: mount filesystem tidak termasuk dalam scope v1"},
		&Unsupported{ResourceKind: "alert", Reason: "alert: alert engine tidak termasuk dalam scope v1; gunakan monitoring stack"},
		&Unsupported{ResourceKind: "webhook", Reason: "webhook: webhook outbound tidak termasuk dalam scope v1"},
		&Unsupported{ResourceKind: "package", Reason: "package: manajemen paket tidak termasuk dalam scope v1"},
	)

	return providers
}
