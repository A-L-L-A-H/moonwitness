package main

import (
	"crypto/tls"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/quic-go/quic-go/http3"
	"github.com/quic-go/webtransport-go"
)

func main() {
	addr := env("WT_ADDR", ":6121")
	certFile := env("WT_CERT_FILE", "/certs/cert.pem")
	keyFile := env("WT_KEY_FILE", "/certs/key.pem")
	allowedOrigin := env("WT_ALLOWED_ORIGIN", "https://webtransport.localhost:8443")

	s := webtransport.Server{
		CheckOrigin: func(r *http.Request) bool {
			// The static browser harness runs on the trusted HTTPS origin on
			// port 8443; keep the allow-list exact and development-only.
			return r.Header.Get("Origin") == allowedOrigin
		},
		H3: &http3.Server{
			Addr: addr,
			TLSConfig: &tls.Config{
				MinVersion: tls.VersionTLS13,
				NextProtos: []string{http3.NextProtoH3},
			},
		},
	}
	webtransport.ConfigureHTTP3Server(s.H3)

	mux := http.NewServeMux()
	mux.HandleFunc("/webtransport", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("upgrade request: method=%s proto=%s origin=%q path=%s", r.Method, r.Proto, r.Header.Get("Origin"), r.URL.Path)
		session, err := s.Upgrade(w, r)
		if err != nil {
			log.Printf("upgrade failed: %v", err)
			return
		}
		defer session.CloseWithError(0, "")
		log.Printf("session accepted: %s", r.URL.Path)

		for {
			stream, err := session.AcceptStream(r.Context())
			if err != nil {
				return
			}
			// This harness deliberately echoes the exact carrier bytes. AEP frame
			// decoding remains in the TypeScript runtime under test.
			if _, err := io.Copy(stream, stream); err != nil {
				log.Printf("stream echo failed: %v", err)
			}
			_ = stream.Close()
		}
	})
	s.H3.Handler = mux

	log.Printf("WebTransport HTTP/3 endpoint listening on %s", addr)
	if err := s.ListenAndServeTLS(certFile, keyFile); err != nil {
		log.Fatal(err)
	}
}

func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
