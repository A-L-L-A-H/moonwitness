# MoonWitness Backlog - Prioritized Work Plan

## Current Status
- **Issue #7 (P1)**: COMPLETED - All 4 dock tests passing
- **Issue #80 (P1)**: In Progress - Stabilize CI workflow

## Priority Order (Easiest to Hardest / Most Urgent First)

### Phase 1: Core RIOT Intelligence (P1 - Unblocked)
| # | Issue | Title | Dependencies | Effort |
|---|-------|-------|--------------|--------|
| 1 | #31 | Implement local inference adapter | #27 Tasks 1-3 | Medium |
| 2 | #32 | Integrate inference through Fastify | #31, #27 Tasks 1-4 | Medium |

### Phase 2: RIOT Intelligence Completion (P2)
| 3 | #33 | Persist provider configuration | #31, #32 | Small |
| 4 | #34 | Add operator UX to Next.js | #31, #32, #33 | Medium |

### Phase 3: Operations Screens (P2 - Some Blocked)
| 5 | #98 | Read-only Syslog explorer | MW-0002, MW-0006 | Medium |
| 6 | #99 | Read-only SNMP monitor | MW-0002, MW-0006 | Medium |
| 7 | #102 | Storage bucket/object browser | MW-0002, MW-0006, MW-0012 | Large |
| 8 | #103 | Read-only RADIUS console | MW-0002, MW-0006, MW-0008 | Medium |

### Phase 4: Management UIs (P1 - All Blocked)
| 9 | #100 | SNMP device/target management UI | #99 | Medium |
| 10 | #104 | RADIUS user management UI | #103 | Medium |
| 11 | #105 | Operations route accessibility | MW-0003 through MW-0015 | Large |

### Phase 5: Platform & Production (P1-P2)
| 12 | #80 | Stabilize CI workflow | (In Progress) | Large |
| 13 | #9 | Production hardening | #80 | Large |
| 14 | #8 | Connect Shadow Command Center | #80 | Medium |

## Recommended Next Action
**Start Issue #31 (RIOT Intelligence local inference adapter)** - It's P1, unblocked, and the foundation for all other RIOT work.
