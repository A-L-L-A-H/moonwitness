//! Password handling for RADIUS Access-Request.
//!
//! PAP User-Password (RFC 2865 §5.2) is XOR-encrypted with
//! MD5(secret + Request Authenticator), chained per 16-byte block.
//! Stored passwords are Argon2id hashes, verified after PAP decryption.

use argon2::password_hash::{
    rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString,
};
use argon2::Argon2;
use md5::{Digest, Md5};

pub fn decrypt_user_password(
    encrypted: &[u8],
    secret: &str,
    request_authenticator: &[u8; 16],
) -> Option<String> {
    if encrypted.is_empty() || !encrypted.len().is_multiple_of(16) {
        return None;
    }
    let secret_bytes = secret.as_bytes();
    let mut out = Vec::with_capacity(encrypted.len());
    let mut prev: Vec<u8> = request_authenticator.to_vec();

    for block in encrypted.chunks(16) {
        let mut hasher = Md5::new();
        hasher.update(secret_bytes);
        hasher.update(&prev);
        let hash = hasher.finalize();
        let plain: Vec<u8> = block.iter().zip(hash.iter()).map(|(c, h)| c ^ h).collect();
        out.extend_from_slice(&plain);
        prev = block.to_vec();
    }

    // Strip trailing NUL padding.
    while out.last() == Some(&0) {
        out.pop();
    }
    String::from_utf8(out).ok()
}

/// RFC 2865 §5.2 PAP encryption helper for unit tests.
#[cfg(test)]
pub(crate) fn encrypt_user_password(
    password: &str,
    secret: &str,
    request_authenticator: &[u8; 16],
) -> Vec<u8> {
    let mut padded = password.as_bytes().to_vec();
    if padded.is_empty() {
        padded.resize(16, 0);
    } else {
        while !padded.len().is_multiple_of(16) {
            padded.push(0);
        }
    }

    let mut out = Vec::with_capacity(padded.len());
    let mut prev = request_authenticator.to_vec();
    for block in padded.chunks(16) {
        let mut hasher = Md5::new();
        hasher.update(secret.as_bytes());
        hasher.update(&prev);
        let hash = hasher.finalize();
        let cipher: Vec<u8> = block.iter().zip(hash.iter()).map(|(p, h)| p ^ h).collect();
        out.extend_from_slice(&cipher);
        prev = cipher;
    }
    out
}

pub fn hash_password(password: &str) -> anyhow::Result<String> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| anyhow::anyhow!("failed to hash password: {e}"))
}

pub fn verify_password(stored_hash: &str, supplied: &str) -> bool {
    let parsed = match PasswordHash::new(stored_hash) {
        Ok(p) => p,
        Err(_) => return false,
    };
    Argon2::default()
        .verify_password(supplied.as_bytes(), &parsed)
        .is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_pap_password() {
        let secret = "testing123";
        let auth = [7u8; 16];
        let password = "hunter2";

        let encrypted = encrypt_user_password(password, secret, &auth);
        let decrypted = decrypt_user_password(&encrypted, secret, &auth).unwrap();
        assert_eq!(decrypted, password);
    }

    #[test]
    fn roundtrip_pap_password_multiblock() {
        let secret = "multi-block-secret";
        let auth = [0x42u8; 16];
        let password = "very-long-pppoe-password-exceeding-16-bytes";

        let encrypted = encrypt_user_password(password, secret, &auth);
        assert_eq!(encrypted.len(), 48);
        let decrypted = decrypt_user_password(&encrypted, secret, &auth).unwrap();
        assert_eq!(decrypted, password);
    }

    #[test]
    fn decrypt_user_password_rejects_malformed_lengths() {
        let auth = [1u8; 16];
        assert!(decrypt_user_password(&[], "secret", &auth).is_none());
        assert!(decrypt_user_password(&[0u8; 15], "secret", &auth).is_none());
        assert!(decrypt_user_password(&[0u8; 17], "secret", &auth).is_none());
    }

    #[test]
    fn decrypt_user_password_with_wrong_secret_does_not_recover_password() {
        let auth = [9u8; 16];
        let password = "correct-horse-battery";
        let encrypted = encrypt_user_password(password, "right-secret", &auth);
        let result = decrypt_user_password(&encrypted, "wrong-secret", &auth);
        assert_ne!(result.as_deref(), Some(password));
    }

    #[test]
    fn decrypt_user_password_rejects_invalid_utf8() {
        let secret = "utf8-secret";
        let auth = [3u8; 16];
        let mut hasher = Md5::new();
        hasher.update(secret.as_bytes());
        hasher.update(auth);
        let hash = hasher.finalize();

        let invalid_utf8 = [0xffu8; 16];
        let encrypted: Vec<u8> = invalid_utf8
            .iter()
            .zip(hash.iter())
            .map(|(p, h)| p ^ h)
            .collect();
        assert!(decrypt_user_password(&encrypted, secret, &auth).is_none());
    }

    #[test]
    fn argon2_hash_verifies_and_rejects() {
        let hash = hash_password("rahasia").unwrap();
        assert!(hash.starts_with("$argon2"));
        assert!(verify_password(&hash, "rahasia"));
        assert!(!verify_password(&hash, "salah"));
        assert!(!verify_password("not-a-hash", "rahasia"));
    }

    #[test]
    fn argon2_salts_differ_per_hash() {
        let a = hash_password("same").unwrap();
        let b = hash_password("same").unwrap();
        assert_ne!(a, b);
    }
}
