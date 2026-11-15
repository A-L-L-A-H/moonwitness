test_file = r"Z:\repo\isrockfeel\moonwitness\apps\web\src\components\shell\nav-items.ts"

with open(test_file, "r", encoding="utf-8") as f:
    content = f.read()

old_active = """const ACTIVE_BY_PATH: Record<string, string> = {
  "/dock": "archive",
  "/mission-control": "dashboard",
  "/intelligence": "intelligence",
  "/syslog": "syslog",
  "/snmp": "snmp",
  "/radius": "radius",
  "/storage": "storage",
  "/shadow": "settings",
  "/id-lab": "id-lab",
};"""

new_active = """const ACTIVE_BY_PATH: Record<string, string> = {
  "/dock": "archive",
  "/mission-control": "dashboard",
  "/intelligence": "intelligence",
  "/syslog": "syslog",
  "/snmp": "snmp",
  "/radius": "radius",
  "/storage": "storage",
  "/vpn": "vpn",
  "/shadow": "settings",
  "/id-lab": "id-lab",
};"""

content = content.replace(old_active, new_active)

with open(test_file, "w", encoding="utf-8") as f:
    f.write(content)

print("File updated successfully")

