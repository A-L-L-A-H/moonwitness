use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine;

const ENC_PREFIX: &str = "enc:v1:";

/// Parse a 32-byte master key from hex (64 chars) or base64.
pub fn parse_master_key(raw: &str) -> anyhow::Result<[u8; 32]> {
    let trimmed = raw.trim();
    if trimmed.len() == 64 && trimmed.chars().all(|c| c.is_ascii_hexdigit()) {
        let mut out = [0u8; 32];
        for i in 0..32 {
            out[i] = u8::from_str_radix(&trimmed[i * 2..i * 2 + 2], 16)?;
        }
        return Ok(out);
    }
    let decoded = B64
        .decode(trimmed)
        .map_err(|e| anyhow::anyhow!("invalid SNMP_CREDENTIAL_KEY base64: {e}"))?;
    if decoded.len() != 32 {
        anyhow::bail!(
            "SNMP_CREDENTIAL_KEY must decode to 32 bytes, got {}",
            decoded.len()
        );
    }
    let mut out = [0u8; 32];
    out.copy_from_slice(&decoded);
    Ok(out)
}

/// Encrypt a credential string using AES-256-GCM.
pub fn encrypt_secret(plaintext: &str, key: &[u8; 32]) -> anyhow::Result<String> {
    if plaintext.is_empty() {
        return Ok(String::new());
    }
    let cipher =
        Aes256Gcm::new_from_slice(key).map_err(|e| anyhow::anyhow!("aes-gcm init failed: {e}"))?;
    let mut nonce_bytes = [0u8; 12];
    getrandom::fill(&mut nonce_bytes).map_err(|e| anyhow::anyhow!("csprng failed: {e}"))?;
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| anyhow::anyhow!("encrypt failed: {e}"))?;

    let mut combined = Vec::with_capacity(12 + ciphertext.len());
    combined.extend_from_slice(&nonce_bytes);
    combined.extend_from_slice(&ciphertext);
    Ok(format!("{ENC_PREFIX}{}", B64.encode(combined)))
}

/// Decrypt a stored credential string. Supports legacy plaintext if not prefixed with `enc:v1:`.
#[allow(dead_code)]
pub fn decrypt_secret(stored: &str, key: &[u8; 32]) -> anyhow::Result<String> {
    if stored.is_empty() {
        return Ok(String::new());
    }
    let Some(b64) = stored.strip_prefix(ENC_PREFIX) else {
        return Ok(stored.to_string());
    };
    let combined = B64
        .decode(b64)
        .map_err(|e| anyhow::anyhow!("invalid encrypted credential base64: {e}"))?;
    if combined.len() < 13 {
        anyhow::bail!("encrypted credential payload too short");
    }
    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let cipher =
        Aes256Gcm::new_from_slice(key).map_err(|e| anyhow::anyhow!("aes-gcm init failed: {e}"))?;
    let plaintext = cipher
        .decrypt(Nonce::from_slice(nonce_bytes), ciphertext)
        .map_err(|e| anyhow::anyhow!("decrypt failed: {e}"))?;
    String::from_utf8(plaintext).map_err(|e| anyhow::anyhow!("decrypted secret not utf8: {e}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_aes256_gcm_secret() {
        let key = [0x42u8; 32];
        let enc = encrypt_secret("super-secret-community", &key).unwrap();
        assert!(enc.starts_with(ENC_PREFIX));
        assert!(!enc.contains("super-secret-community"));
        let dec = decrypt_secret(&enc, &key).unwrap();
        assert_eq!(dec, "super-secret-community");
    }

    #[test]
    fn wrong_key_fails_decryption() {
        let key1 = [0x42u8; 32];
        let key2 = [0x99u8; 32];
        let enc = encrypt_secret("auth-passphrase", &key1).unwrap();
        assert!(decrypt_secret(&enc, &key2).is_err());
    }

    #[test]
    fn parses_hex_and_base64_keys() {
        let hex_key = "01".repeat(32);
        let parsed = parse_master_key(&hex_key).unwrap();
        assert_eq!(parsed, [0x01u8; 32]);

        let b64_key = B64.encode([0x02u8; 32]);
        let parsed_b64 = parse_master_key(&b64_key).unwrap();
        assert_eq!(parsed_b64, [0x02u8; 32]);
    }
}
