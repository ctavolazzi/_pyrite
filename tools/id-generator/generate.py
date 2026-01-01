#!/usr/bin/env python3
"""
ID Generator - Generate and validate Pyrite work tracking IDs.

Supports:
  - Work Efforts: WE-YYMMDD-xxxx
  - Tickets: TKT-xxxx-NNN
  - Checkpoints: CKPT-YYMMDD-HHMM

Usage:
  python3 tools/id-generator/generate.py work-effort
  python3 tools/id-generator/generate.py ticket --parent WE-251231-a1b2
  python3 tools/id-generator/generate.py checkpoint
  python3 tools/id-generator/generate.py validate WE-251231-a1b2
  python3 tools/id-generator/generate.py parse TKT-a1b2-001
"""

import argparse
import random
import string
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any

# =============================================================================
# ID PATTERNS
# =============================================================================

PATTERNS = {
    'work_effort': r'^WE-(\d{6})-([a-z0-9]{4})$',
    'ticket': r'^TKT-([a-z0-9]{4})-(\d{3})$',
    'checkpoint': r'^CKPT-(\d{6})-(\d{4})$',
}

# =============================================================================
# ID GENERATORS (Switch Statement Pattern)
# =============================================================================

def generate_id(id_type: str, **kwargs) -> str:
    """
    Generate an ID based on type.

    This is the main switch statement for ID generation.
    """
    generators = {
        'work-effort': _generate_work_effort_id,
        'work_effort': _generate_work_effort_id,
        'we': _generate_work_effort_id,

        'ticket': _generate_ticket_id,
        'tkt': _generate_ticket_id,

        'checkpoint': _generate_checkpoint_id,
        'ckpt': _generate_checkpoint_id,
    }

    generator = generators.get(id_type.lower())
    if not generator:
        raise ValueError(f"Unknown ID type: {id_type}. Valid types: {list(generators.keys())}")

    return generator(**kwargs)


def _generate_work_effort_id(**kwargs) -> str:
    """Generate WE-YYMMDD-xxxx"""
    date_str = datetime.now().strftime('%y%m%d')
    suffix = _random_suffix(4)
    return f"WE-{date_str}-{suffix}"


def _generate_ticket_id(parent: str = None, number: int = None, **kwargs) -> str:
    """Generate TKT-xxxx-NNN"""
    if parent:
        # Extract suffix from parent work effort
        match = re.match(PATTERNS['work_effort'], parent)
        if match:
            suffix = match.group(2)
        else:
            raise ValueError(f"Invalid parent work effort ID: {parent}")
    else:
        suffix = _random_suffix(4)

    if number is None:
        # Try to find next number by scanning directory
        number = _find_next_ticket_number(suffix)

    return f"TKT-{suffix}-{number:03d}"


def _generate_checkpoint_id(**kwargs) -> str:
    """Generate CKPT-YYMMDD-HHMM"""
    now = datetime.now()
    date_str = now.strftime('%y%m%d')
    time_str = now.strftime('%H%M')
    return f"CKPT-{date_str}-{time_str}"


def _random_suffix(length: int) -> str:
    """Generate random alphanumeric suffix (lowercase)"""
    chars = string.ascii_lowercase + string.digits
    return ''.join(random.choice(chars) for _ in range(length))


def _find_next_ticket_number(suffix: str) -> int:
    """Find the next ticket number for a work effort suffix"""
    work_efforts_dir = Path.cwd() / '_work_efforts'
    if not work_efforts_dir.exists():
        return 1

    max_num = 0
    pattern = re.compile(f'TKT-{suffix}-(\\d{{3}})')

    for path in work_efforts_dir.rglob('*.md'):
        match = pattern.search(path.name)
        if match:
            num = int(match.group(1))
            max_num = max(max_num, num)

    return max_num + 1


# =============================================================================
# ID VALIDATORS (Switch Statement Pattern)
# =============================================================================

def validate_id(id_string: str) -> Dict[str, Any]:
    """
    Validate an ID and return its type and components.

    This is the switch statement for ID validation.
    """
    validators = [
        ('work_effort', PATTERNS['work_effort'], _parse_work_effort),
        ('ticket', PATTERNS['ticket'], _parse_ticket),
        ('checkpoint', PATTERNS['checkpoint'], _parse_checkpoint),
    ]

    for id_type, pattern, parser in validators:
        match = re.match(pattern, id_string)
        if match:
            return {
                'valid': True,
                'type': id_type,
                'id': id_string,
                **parser(match)
            }

    return {
        'valid': False,
        'type': None,
        'id': id_string,
        'error': f"Does not match any known pattern"
    }


def _parse_work_effort(match: re.Match) -> Dict[str, Any]:
    """Parse work effort ID components"""
    date_str = match.group(1)
    suffix = match.group(2)

    try:
        date = datetime.strptime(date_str, '%y%m%d')
    except ValueError:
        date = None

    return {
        'date': date.strftime('%Y-%m-%d') if date else None,
        'suffix': suffix,
        'folder_pattern': f"WE-{date_str}-{suffix}_*",
    }


def _parse_ticket(match: re.Match) -> Dict[str, Any]:
    """Parse ticket ID components"""
    suffix = match.group(1)
    number = int(match.group(2))

    return {
        'parent_suffix': suffix,
        'number': number,
        'parent_pattern': f"WE-*-{suffix}",
    }


def _parse_checkpoint(match: re.Match) -> Dict[str, Any]:
    """Parse checkpoint ID components"""
    date_str = match.group(1)
    time_str = match.group(2)

    try:
        dt = datetime.strptime(f"{date_str}{time_str}", '%y%m%d%H%M')
    except ValueError:
        dt = None

    return {
        'date': dt.strftime('%Y-%m-%d') if dt else None,
        'time': dt.strftime('%H:%M') if dt else None,
        'datetime': dt.isoformat() if dt else None,
    }


# =============================================================================
# CLI COMMANDS
# =============================================================================

def cmd_generate(args):
    """Generate a new ID"""
    kwargs = {}
    if hasattr(args, 'parent') and args.parent:
        kwargs['parent'] = args.parent
    if hasattr(args, 'number') and args.number:
        kwargs['number'] = args.number

    new_id = generate_id(args.type, **kwargs)

    if args.json:
        import json
        result = validate_id(new_id)
        print(json.dumps(result, indent=2))
    else:
        print(new_id)


def cmd_validate(args):
    """Validate an existing ID"""
    result = validate_id(args.id)

    if args.json:
        import json
        print(json.dumps(result, indent=2))
    else:
        if result['valid']:
            print(f"✅ Valid {result['type']}: {result['id']}")
            for key, value in result.items():
                if key not in ('valid', 'type', 'id'):
                    print(f"   {key}: {value}")
        else:
            print(f"❌ Invalid: {result['id']}")
            print(f"   {result['error']}")
            sys.exit(1)


def cmd_parse(args):
    """Parse an ID and show components"""
    result = validate_id(args.id)

    if args.json:
        import json
        print(json.dumps(result, indent=2))
    else:
        if result['valid']:
            print(f"Type: {result['type']}")
            print(f"ID: {result['id']}")
            print("Components:")
            for key, value in result.items():
                if key not in ('valid', 'type', 'id'):
                    print(f"  {key}: {value}")
        else:
            print(f"❌ Cannot parse: {result['id']}")
            sys.exit(1)


def cmd_list_types(args):
    """List all supported ID types"""
    print("Supported ID Types:")
    print()
    print("  work-effort (we)")
    print("    Format: WE-YYMMDD-xxxx")
    print("    Example: WE-251231-a1b2")
    print()
    print("  ticket (tkt)")
    print("    Format: TKT-xxxx-NNN")
    print("    Example: TKT-a1b2-001")
    print("    Requires: --parent WE-YYMMDD-xxxx")
    print()
    print("  checkpoint (ckpt)")
    print("    Format: CKPT-YYMMDD-HHMM")
    print("    Example: CKPT-251231-1430")


def cmd_batch(args):
    """Generate multiple IDs for a workflow"""
    print("=" * 50)
    print("Batch ID Generation")
    print("=" * 50)

    # Generate work effort
    we_id = generate_id('work-effort')
    print(f"\n📁 Work Effort: {we_id}")

    # Generate tickets
    if args.tickets:
        print(f"\n📋 Tickets ({args.tickets}):")
        for i in range(1, args.tickets + 1):
            tkt_id = generate_id('ticket', parent=we_id, number=i)
            print(f"   {tkt_id}")

    # Generate checkpoint
    if args.checkpoint:
        ckpt_id = generate_id('checkpoint')
        print(f"\n📍 Checkpoint: {ckpt_id}")

    print()


# =============================================================================
# MAIN
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Generate and validate Pyrite work tracking IDs",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate IDs
  %(prog)s work-effort
  %(prog)s ticket --parent WE-251231-a1b2
  %(prog)s checkpoint

  # Validate IDs
  %(prog)s validate WE-251231-a1b2
  %(prog)s parse TKT-a1b2-001

  # Batch generation
  %(prog)s batch --tickets 5 --checkpoint

  # List types
  %(prog)s types
"""
    )

    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # Generate work effort
    we_parser = subparsers.add_parser('work-effort', aliases=['we'], help='Generate work effort ID')
    we_parser.add_argument('--json', action='store_true', help='Output as JSON')
    we_parser.set_defaults(func=cmd_generate, type='work-effort')

    # Generate ticket
    tkt_parser = subparsers.add_parser('ticket', aliases=['tkt'], help='Generate ticket ID')
    tkt_parser.add_argument('--parent', '-p', help='Parent work effort ID')
    tkt_parser.add_argument('--number', '-n', type=int, help='Ticket number (auto if not specified)')
    tkt_parser.add_argument('--json', action='store_true', help='Output as JSON')
    tkt_parser.set_defaults(func=cmd_generate, type='ticket')

    # Generate checkpoint
    ckpt_parser = subparsers.add_parser('checkpoint', aliases=['ckpt'], help='Generate checkpoint ID')
    ckpt_parser.add_argument('--json', action='store_true', help='Output as JSON')
    ckpt_parser.set_defaults(func=cmd_generate, type='checkpoint')

    # Validate
    validate_parser = subparsers.add_parser('validate', help='Validate an ID')
    validate_parser.add_argument('id', help='ID to validate')
    validate_parser.add_argument('--json', action='store_true', help='Output as JSON')
    validate_parser.set_defaults(func=cmd_validate)

    # Parse
    parse_parser = subparsers.add_parser('parse', help='Parse an ID into components')
    parse_parser.add_argument('id', help='ID to parse')
    parse_parser.add_argument('--json', action='store_true', help='Output as JSON')
    parse_parser.set_defaults(func=cmd_parse)

    # List types
    types_parser = subparsers.add_parser('types', help='List supported ID types')
    types_parser.set_defaults(func=cmd_list_types)

    # Batch
    batch_parser = subparsers.add_parser('batch', help='Generate a batch of IDs for a workflow')
    batch_parser.add_argument('--tickets', '-t', type=int, default=0, help='Number of tickets to generate')
    batch_parser.add_argument('--checkpoint', '-c', action='store_true', help='Include checkpoint ID')
    batch_parser.set_defaults(func=cmd_batch)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    args.func(args)


if __name__ == '__main__':
    main()

