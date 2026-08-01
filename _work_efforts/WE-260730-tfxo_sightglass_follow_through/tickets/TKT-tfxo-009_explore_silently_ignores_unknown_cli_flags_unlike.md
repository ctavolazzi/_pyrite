---
id: TKT-tfxo-009
title: "explore silently ignores unknown CLI flags, unlike run"
status: pending
created: 2026-08-01T08:55:08.046Z
labels: ['pyrite']
---

# explore silently ignores unknown CLI flags, unlike run

## Description

`run` rejects an unrecognised option with "unknown option --x". `explore` does its own ad-hoc parsing (argv.find(a => !a.startsWith('-'))) and drops anything it does not know, with no message. Found by passing --dir to explore: it was accepted, ignored, and state was written to the default .sightglass/explore instead. A flag that does nothing and says nothing is the same family of quiet wrongness the rest of this repo is built against.

## Status

- [ ] Not started

## Notes

Add implementation notes here.
