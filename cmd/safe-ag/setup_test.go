package main

import (
	"reflect"
	"strings"
	"testing"
)

func TestParseAppleContainerNATSubnets(t *testing.T) {
	out := []byte(`[
		{
			"configuration": {"mode": "nat", "ipv4Subnet": "192.168.64.0/24"},
			"status": {"ipv4Subnet": "192.168.64.0/24"}
		},
		{
			"configuration": {"mode": "nat", "ipv4Subnet": "192.168.65.0/24"},
			"status": {}
		},
		{
			"configuration": {"mode": "host", "ipv4Subnet": "192.168.66.0/24"},
			"status": {"ipv4Subnet": "192.168.66.0/24"}
		},
		{
			"configuration": {"mode": "nat", "ipv4Subnet": "192.168.64.0/24"},
			"status": {"ipv4Subnet": "192.168.64.0/24"}
		}
	]`)
	got, err := parseAppleContainerNATSubnets(out)
	if err != nil {
		t.Fatalf("parseAppleContainerNATSubnets returned error: %v", err)
	}
	want := []string{"192.168.64.0/24", "192.168.65.0/24"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("subnets = %v, want %v", got, want)
	}
}

func TestParseAppleContainerNATSubnetsInvalidJSON(t *testing.T) {
	_, err := parseAppleContainerNATSubnets([]byte(`not-json`))
	if err == nil || !strings.Contains(err.Error(), "parse Apple container networks") {
		t.Fatalf("error = %v, want parse error", err)
	}
}

func TestParseDefaultHostInterface(t *testing.T) {
	got, err := parseDefaultHostInterface([]byte("   route to: default\ninterface: en0\n"))
	if err != nil {
		t.Fatalf("parseDefaultHostInterface returned error: %v", err)
	}
	if got != "en0" {
		t.Fatalf("interface = %q, want en0", got)
	}
}

func TestParseDefaultHostInterfaceMissing(t *testing.T) {
	_, err := parseDefaultHostInterface([]byte("route to: default\n"))
	if err == nil || !strings.Contains(err.Error(), "no interface") {
		t.Fatalf("error = %v, want missing interface error", err)
	}
}

func TestSetupQuotingHelpers(t *testing.T) {
	if got, want := shellSingleQuote("a'b"), "'a'\"'\"'b'"; got != want {
		t.Fatalf("shellSingleQuote = %q, want %q", got, want)
	}
	if got, want := appleScriptQuote(`cmd "arg" \ tail`), `"cmd \"arg\" \\ tail"`; got != want {
		t.Fatalf("appleScriptQuote = %q, want %q", got, want)
	}
}
