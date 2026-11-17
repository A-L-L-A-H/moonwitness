//! RADIUS attribute (TLV) constants and helpers.

pub const USER_NAME: u8 = 1;
pub const USER_PASSWORD: u8 = 2;
pub const FRAMED_IP_ADDRESS: u8 = 8;
pub const ERROR_MESSAGE: u8 = 18;
pub const SESSION_TIMEOUT: u8 = 27;

// RFC 2868 tunnel attributes — the standards-based way to assign a VLAN.
pub const TUNNEL_TYPE: u8 = 64;
pub const TUNNEL_MEDIUM_TYPE: u8 = 65;
pub const TUNNEL_PRIVATE_GROUP_ID: u8 = 81;
pub const TUNNEL_TYPE_VLAN: u32 = 13;
pub const TUNNEL_MEDIUM_TYPE_IEEE_802: u32 = 6;

pub const ACCT_STATUS_TYPE: u8 = 40;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Attribute {
    pub type_code: u8,
    pub value: Vec<u8>,
}

impl Attribute {
    pub fn new(type_code: u8, value: &[u8]) -> Self {
        Attribute {
            type_code,
            value: value.to_vec(),
        }
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        let len = 2 + self.value.len();
        let mut out = Vec::with_capacity(len);
        out.push(self.type_code);
        out.push(len as u8);
        out.extend_from_slice(&self.value);
        out
    }

    pub fn parse(data: &[u8]) -> Vec<Attribute> {
        let mut out = Vec::new();
        let mut i = 0;
        while i + 2 <= data.len() {
            let type_code = data[i];
            let len = data[i + 1] as usize;
            if len < 2 || i + len > data.len() {
                break;
            }
            out.push(Attribute {
                type_code,
                value: data[i + 2..i + len].to_vec(),
            });
            i += len;
        }
        out
    }
}

pub fn attr_bytes(attrs: &[Attribute], type_code: u8) -> Option<&[u8]> {
    attrs
        .iter()
        .find(|a| a.type_code == type_code)
        .map(|a| a.value.as_slice())
}

pub fn attr_string(attrs: &[Attribute], type_code: u8) -> Option<String> {
    attr_bytes(attrs, type_code).and_then(|b| String::from_utf8(b.to_vec()).ok())
}

pub fn attr_u32(attrs: &[Attribute], type_code: u8) -> Option<u32> {
    attr_bytes(attrs, type_code).and_then(|b| {
        if b.len() == 4 {
            Some(u32::from_be_bytes([b[0], b[1], b[2], b[3]]))
        } else {
            None
        }
    })
}

/// RFC 2868 tunnel attributes that tell the NAS to put the session on a VLAN.
pub fn vlan_attributes(vlan: u16) -> Vec<Attribute> {
    let group_id = vlan.to_string();
    vec![
        Attribute::new(TUNNEL_TYPE, &TUNNEL_TYPE_VLAN.to_be_bytes()),
        Attribute::new(
            TUNNEL_MEDIUM_TYPE,
            &TUNNEL_MEDIUM_TYPE_IEEE_802.to_be_bytes(),
        ),
        Attribute::new(TUNNEL_PRIVATE_GROUP_ID, group_id.as_bytes()),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_and_typed_helpers() {
        let mut attrs = vec![
            Attribute::new(USER_NAME, b"alice"),
            Attribute::new(SESSION_TIMEOUT, &3600u32.to_be_bytes()),
        ];
        attrs.extend(vlan_attributes(100));

        let mut encoded = Vec::new();
        for attr in &attrs {
            encoded.extend_from_slice(&attr.to_bytes());
        }
        let decoded = Attribute::parse(&encoded);
        assert_eq!(decoded, attrs);
        assert_eq!(attr_string(&decoded, USER_NAME).as_deref(), Some("alice"));
        assert_eq!(attr_u32(&decoded, SESSION_TIMEOUT), Some(3600));
        assert_eq!(attr_u32(&decoded, TUNNEL_TYPE), Some(TUNNEL_TYPE_VLAN));
        assert_eq!(
            attr_u32(&decoded, TUNNEL_MEDIUM_TYPE),
            Some(TUNNEL_MEDIUM_TYPE_IEEE_802)
        );
        assert_eq!(
            attr_string(&decoded, TUNNEL_PRIVATE_GROUP_ID).as_deref(),
            Some("100")
        );
    }

    #[test]
    fn parse_stops_safely_on_zero_length_or_truncated_attribute() {
        // Zero-length attribute must terminate without looping.
        let zero_len = [USER_NAME, 0, b'a', b'b'];
        assert!(Attribute::parse(&zero_len).is_empty());

        // Length 1 (< 2 header bytes) must terminate.
        let tiny_len = [USER_NAME, 1, b'a'];
        assert!(Attribute::parse(&tiny_len).is_empty());

        // Valid first attribute followed by truncated second attribute keeps first only.
        let mut bytes = Attribute::new(USER_NAME, b"bob").to_bytes();
        bytes.extend_from_slice(&[ACCT_STATUS_TYPE, 6, 0, 0]);
        let parsed = Attribute::parse(&bytes);
        assert_eq!(parsed, vec![Attribute::new(USER_NAME, b"bob")]);
    }
}
