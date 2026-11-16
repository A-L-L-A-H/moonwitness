package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestEdgeBridgeAuthAndHealth(t *testing.T) {
	seenToken := ""
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seenToken = r.Header.Get(bridgeTokenHeader)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok:" + r.URL.Path))
	}))
	defer upstream.Close()

	routes, err := parseRoutes("memory-edge.moonwitness.biz.id=" + upstream.URL)
	if err != nil {
		t.Fatalf("parseRoutes failed: %v", err)
	}
	handler := newBridgeHandler(routes, "super-secret-bridge-token-123456")

	// Unauthenticated /health succeeds
	reqHealth := httptest.NewRequest(http.MethodGet, "http://memory-edge.moonwitness.biz.id/health", nil)
	resHealth := httptest.NewRecorder()
	handler.ServeHTTP(resHealth, reqHealth)
	if resHealth.Code != http.StatusOK || resHealth.Body.String() != "ok:/health" {
		t.Fatalf("expected /health 200 ok:/health, got %d %s", resHealth.Code, resHealth.Body.String())
	}

	// Unauthenticated /api/knowledge rejected with 401
	reqUnauth := httptest.NewRequest(http.MethodGet, "http://memory-edge.moonwitness.biz.id/api/knowledge", nil)
	resUnauth := httptest.NewRecorder()
	handler.ServeHTTP(resUnauth, reqUnauth)
	if resUnauth.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for unauthenticated api call, got %d", resUnauth.Code)
	}

	// Valid bridge token succeeds and strips header upstream
	reqAuth := httptest.NewRequest(http.MethodGet, "http://memory-edge.moonwitness.biz.id/api/knowledge", nil)
	reqAuth.Header.Set(bridgeTokenHeader, "super-secret-bridge-token-123456")
	resAuth := httptest.NewRecorder()
	handler.ServeHTTP(resAuth, reqAuth)
	if resAuth.Code != http.StatusOK || resAuth.Body.String() != "ok:/api/knowledge" {
		t.Fatalf("expected 200 ok:/api/knowledge, got %d %s", resAuth.Code, resAuth.Body.String())
	}
	if seenToken != "" {
		t.Fatalf("expected bridge token header stripped upstream, got %q", seenToken)
	}

	// Unknown host returns 404
	reqUnknown := httptest.NewRequest(http.MethodGet, "http://other.example/health", nil)
	resUnknown := httptest.NewRecorder()
	handler.ServeHTTP(resUnknown, reqUnknown)
	if resUnknown.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for unknown host, got %d", resUnknown.Code)
	}
}
