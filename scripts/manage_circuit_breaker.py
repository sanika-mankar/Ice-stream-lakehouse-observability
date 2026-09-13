#!/usr/bin/env python3
"""Operational CLI tool for Ice Stream Circuit Breaker & Incident Management (Master 6).

Usage:
  python scripts/manage_circuit_breaker.py status
  python scripts/manage_circuit_breaker.py recover
  python scripts/manage_circuit_breaker.py incidents [--limit 20]
  python scripts/manage_circuit_breaker.py acknowledge <incident_id>
  python scripts/manage_circuit_breaker.py resolve <incident_id> --reason "..."
"""

import argparse
import sys
from pathlib import Path
from dotenv import load_dotenv

# Ensure repo root is on sys.path
repo_root = Path(__file__).resolve().parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

load_dotenv()

from app.observability.service import get_observability_service


def cmd_status(service, args):
    snap = service.get_snapshot()
    active = service.get_active_incidents()
    print("=" * 65)
    print("           ICE STREAM OPERATIONAL STATUS & CIRCUIT STATE         ")
    print("=" * 65)
    print(f" Circuit Breaker State : {snap.circuit_state.value}")
    print(f" Pipeline Health       : {snap.pipeline_state.value}")
    print(f" Threshold             : {service.circuit_breaker.threshold:.2%}")
    print(f" Recovery Attempts     : {snap.recovery_attempts}")
    print(f" Current Error Rate    : {snap.current_error_rate:.2%}")
    print(f" Current Quality Score : {snap.quality_score:.1f} / 100.0")
    print(f" Current Throughput    : {snap.throughput_events_per_second:.1f} events/sec")
    print(f" Processed Total       : {snap.processed_events_total}")
    print(f" Valid Total           : {snap.valid_events_total}")
    print(f" Invalid Total         : {snap.invalid_events_total}")
    print(f" Active Incidents      : {len(active)}")
    print(f" Total Incidents       : {snap.incident_count}")
    print(f" Uptime                : {snap.uptime_seconds:.1f}s")
    print("=" * 65)
    if active:
        print("\nActive Incidents:")
        for inc in active:
            print(f"  - [{inc.status.value}] {inc.incident_id} | {inc.incident_type.value} | Severity: {inc.severity.value}")
            print(f"    Error Rate: {inc.error_rate:.2%} | Processed: {inc.processed_count} | Invalid: {inc.invalid_count}")
            print(f"    Reason: {inc.reason}")
            print(f"    Created: {inc.created_at}")


def cmd_recover(service, args):
    print("[OPERATOR] Initiating controlled recovery...")
    success = service.initiate_recovery()
    if success:
        print("[SUCCESS] Circuit transitioned to HALF_OPEN. Active incidents marked RESOLVING.")
        print("         Send controlled probe traffic through Flink to evaluate recovery.")
    else:
        print(f"[FAILED] Cannot initiate recovery from current state: {service.circuit_breaker.state.value}")


def cmd_incidents(service, args):
    incidents = service.list_incidents(limit=args.limit)
    print("=" * 80)
    print(f"                      RECENT INCIDENTS (Limit: {args.limit})                     ")
    print("=" * 80)
    if not incidents:
        print(" No incidents recorded.")
        return
    for inc in incidents:
        print(f"ID       : {inc.incident_id}")
        print(f"Type     : {inc.incident_type.value} | Severity: {inc.severity.value} | Status: {inc.status.value}")
        print(f"Circuit  : {inc.circuit_state.value} | Error Rate: {inc.error_rate:.2%} (Threshold: {inc.threshold:.2%})")
        print(f"Window   : {inc.window_start} -> {inc.window_end}")
        print(f"Counts   : Processed={inc.processed_count}, Valid={inc.valid_count}, Invalid={inc.invalid_count}")
        print(f"Reason   : {inc.reason}")
        if inc.resolved_at:
            print(f"Resolved : {inc.resolved_at} (Reason: {inc.resolution_reason})")
        print("-" * 80)


def cmd_acknowledge(service, args):
    inc = service.acknowledge_incident(args.incident_id)
    if inc:
        print(f"[SUCCESS] Incident {args.incident_id} acknowledged.")
    else:
        print(f"[ERROR] Incident {args.incident_id} not found.")


def cmd_resolve(service, args):
    inc = service.resolve_incident(args.incident_id, args.reason)
    if inc:
        print(f"[SUCCESS] Incident {args.incident_id} resolved with reason: '{args.reason}'.")
    else:
        print(f"[ERROR] Incident {args.incident_id} not found.")


def main():
    parser = argparse.ArgumentParser(description="Ice Stream Circuit Breaker Operator CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # status
    subparsers.add_parser("status", help="Show current circuit, pipeline health, and metrics")

    # recover
    subparsers.add_parser("recover", help="Transition circuit from OPEN to HALF_OPEN")

    # incidents
    p_inc = subparsers.add_parser("incidents", help="List persisted incidents")
    p_inc.add_argument("--limit", type=int, default=20, help="Maximum incidents to return")

    # acknowledge
    p_ack = subparsers.add_parser("acknowledge", help="Acknowledge an incident")
    p_ack.add_argument("incident_id", help="Incident ID to acknowledge")

    # resolve
    p_res = subparsers.add_parser("resolve", help="Resolve an incident manually")
    p_res.add_argument("incident_id", help="Incident ID to resolve")
    p_res.add_argument("--reason", required=True, help="Resolution rationale")

    args = parser.parse_args()
    service = get_observability_service()

    if args.command == "status":
        cmd_status(service, args)
    elif args.command == "recover":
        cmd_recover(service, args)
    elif args.command == "incidents":
        cmd_incidents(service, args)
    elif args.command == "acknowledge":
        cmd_acknowledge(service, args)
    elif args.command == "resolve":
        cmd_resolve(service, args)


if __name__ == "__main__":
    main()
