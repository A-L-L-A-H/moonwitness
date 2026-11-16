package main

import (
	"context"
	"crypto/subtle"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"
)

const bridgeTokenHeader = "X-MoonWitness-Bridge-Token"

func parseRoutes(spec string) (map[string]*url.URL, error) {
	routes := map[string]*url.URL{}
	for _, entry := range strings.Split(spec, ",") {
		trimmed := strings.TrimSpace(entry)
		if trimmed == "" {
			continue
		}
		eq := strings.IndexByte(trimmed, '=')
		if eq <= 0 || eq == len(trimmed)-1 {
			return nil, fmt.Errorf("invalid route entry: %q", trimmed)
		}
		host := strings.ToLower(strings.TrimSpace(trimmed[:eq]))
		rawTarget := strings.TrimSpace(trimmed[eq+1:])
		parsed, err := url.Parse(rawTarget)
		if err != nil || parsed.Scheme == "" || parsed.Host == "" {
			return nil, fmt.Errorf("invalid upstream url for %s: %q", host, rawTarget)
		}
		routes[host] = parsed
	}
	if len(routes) == 0 {
		return nil, errors.New("EDGE_BRIDGE_ROUTES must define at least one host=url mapping")
	}
	return routes, nil
}

func newBridgeHandler(routes map[string]*url.URL, token string) http.Handler {
	proxies := make(map[string]*httputil.ReverseProxy, len(routes))
	for host, target := range routes {
		targetCopy := target
		proxy := httputil.NewSingleHostReverseProxy(targetCopy)
		origDirector := proxy.Director
		proxy.Director = func(req *http.Request) {
			origDirector(req)
			req.Header.Del(bridgeTokenHeader)
			req.Host = targetCopy.Host
		}
		proxy.ErrorHandler = func(w http.ResponseWriter, _ *http.Request, _ error) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadGateway)
			_, _ = w.Write([]byte(`{"error":"upstream service unreachable","reachable":false}`))
		}
		proxies[host] = proxy
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		host := strings.ToLower(strings.Split(r.Host, ":")[0])
		proxy, ok := proxies[host]
		if !ok {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			_, _ = w.Write([]byte(`{"error":"unknown edge bridge host"}`))
			return
		}

		// Allow unauthenticated liveness probes solely on GET /health; all API routes require shared token.
		if !(r.Method == http.MethodGet && r.URL.Path == "/health") {
			provided := r.Header.Get(bridgeTokenHeader)
			if len(provided) == 0 || subtle.ConstantTimeCompare([]byte(provided), []byte(token)) != 1 {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusUnauthorized)
				_, _ = w.Write([]byte(`{"error":"missing or invalid bridge token"}`))
				return
			}
		}

		proxy.ServeHTTP(w, r)
	})
}

func main() {
	listen := strings.TrimSpace(os.Getenv("EDGE_BRIDGE_LISTEN"))
	if listen == "" {
		listen = "127.0.0.1:8788"
	}
	token := strings.TrimSpace(os.Getenv("EDGE_BRIDGE_TOKEN"))
	if len(token) < 16 {
		log.Fatal("EDGE_BRIDGE_TOKEN must be at least 16 characters")
	}
	routes, err := parseRoutes(os.Getenv("EDGE_BRIDGE_ROUTES"))
	if err != nil {
		log.Fatalf("route configuration error: %v", err)
	}

	srv := &http.Server{
		Addr:              listen,
		Handler:           newBridgeHandler(routes, token),
		ReadHeaderTimeout: 10 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()
	go func() {
		<-ctx.Done()
		_ = srv.Close()
	}()

	log.Printf("edge-bridge listening on %s (%d routes)", listen, len(routes))
	if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("server failed: %v", err)
	}
}
