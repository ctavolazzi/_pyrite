#!/usr/bin/env python3
from __future__ import annotations

import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

import frontmatter
from fastmcp import FastMCP

SERVER_NAME = "docs-maintainer"
VERSION = "0.1.0"

DOCS_DIRNAME = "_docs"
WORK_EFFORTS_DIRNAME = "_work_efforts"

DEFAULT_AREAS = {
    "10-19": "10-19_project_admin",
    "20-29": "20-29_development",
    "30-39": "30-39_reference",
}

WIKI_LINK_RE = re.compile(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]")
NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")

mcp = FastMCP(SERVER_NAME)


def iso_now() -> str:
    return (
        datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z")
    )


def slugify(text: str) -> str:
    slug = NON_ALNUM_RE.sub("_", text.lower()).strip("_")
    return slug or "untitled"


def extract_title(content: str) -> Optional[str]:
    for line in content.splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return None


def extract_id(stem: str) -> Optional[str]:
    match = re.match(r"^(\d+\.\d+)", stem)
    return match.group(1) if match else None


def display_fallback_title(stem: str) -> str:
    base = re.sub(r"^\d+\.\d+_?", "", stem)
    base = base.replace("_", " ").strip()
    return base.title() if base else stem


def display_area_name(dir_name: str) -> str:
    prefix, _, rest = dir_name.partition("_")
    label = rest.replace("_", " ").replace("-", " ").strip().title() if rest else "Area"
    return f"{prefix} {label}".strip()


def display_category_name(dir_name: str) -> str:
    prefix, _, rest = dir_name.partition("_")
    label = rest.replace("_", " ").replace("-", " ").strip().title() if rest else "Category"
    return f"{prefix} {label}".strip()


def ensure_list(value) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [item for item in value if isinstance(item, str)]
    if isinstance(value, str):
        return [value]
    return []


def extract_link_target(link: str) -> str:
    match = WIKI_LINK_RE.search(link)
    if match:
        return match.group(1).strip()
    return link.strip()


def collect_repo_index(repo_root: Path) -> Tuple[set, set]:
    stems = set()
    relpaths = set()
    for base in (DOCS_DIRNAME, WORK_EFFORTS_DIRNAME):
        base_path = repo_root / base
        if not base_path.exists():
            continue
        for file_path in base_path.rglob("*.md"):
            stems.add(file_path.stem)
            relpaths.add(file_path.relative_to(repo_root).with_suffix("").as_posix())
    return stems, relpaths


def link_target_exists(target: str, stems: set, relpaths: set) -> bool:
    cleaned = target.strip()
    if not cleaned:
        return False
    if cleaned.startswith("/"):
        cleaned = cleaned[1:]
    if cleaned.lower().endswith(".md"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.replace("\\", "/")
    if "/" in cleaned:
        return cleaned in relpaths
    return cleaned in stems


def resolve_docs_root(repo_path: str) -> Path:
    return Path(repo_path).expanduser().resolve() / DOCS_DIRNAME


def resolve_area_dir(docs_root: Path, area: str) -> Path:
    candidate = docs_root / area
    if candidate.is_dir():
        return candidate

    prefix = area.split("_")[0]
    matches = [p for p in docs_root.iterdir() if p.is_dir() and p.name.startswith(prefix)]
    if matches:
        return sorted(matches, key=lambda p: p.name)[0]

    name = DEFAULT_AREAS.get(prefix, f"{prefix}_area")
    area_dir = docs_root / name
    area_dir.mkdir(parents=True, exist_ok=True)
    return area_dir


def resolve_category_dir(area_dir: Path, category: str) -> Path:
    candidate = area_dir / category
    if candidate.is_dir():
        return candidate

    prefix = category.split("_")[0]
    matches = [p for p in area_dir.iterdir() if p.is_dir() and p.name.startswith(prefix)]
    if matches:
        return sorted(matches, key=lambda p: p.name)[0]

    name = category if "_" in category else f"{prefix}_category"
    category_dir = area_dir / name
    category_dir.mkdir(parents=True, exist_ok=True)
    return category_dir


def get_next_id(category_dir: Path) -> str:
    existing = [
        f.stem for f in category_dir.glob("*.md") if not f.stem.endswith("_index")
    ]
    numbers = []
    for stem in existing:
        match = re.match(r"^\d+\.(\d+)", stem)
        if match:
            numbers.append(int(match.group(1)))
    next_num = max(numbers, default=0) + 1
    category = category_dir.name.split("_")[0]
    return f"{category}.{next_num:02d}"


def area_sort_key(path: Path) -> Tuple[int, str]:
    match = re.match(r"^(\d+)", path.name)
    return (int(match.group(1)) if match else 999, path.name)


def category_sort_key(path: Path) -> Tuple[int, str]:
    match = re.match(r"^(\d+)", path.name)
    return (int(match.group(1)) if match else 999, path.name)


def doc_sort_key(doc_id: Optional[str], stem: str) -> Tuple[int, int, str]:
    value = doc_id or stem
    match = re.match(r"^(\d+)\.(\d+)", value)
    if match:
        return (int(match.group(1)), int(match.group(2)), stem)
    return (999, 999, stem)


def iter_area_dirs(docs_root: Path) -> List[Path]:
    return sorted([p for p in docs_root.iterdir() if p.is_dir()], key=area_sort_key)


def iter_category_dirs(area_dir: Path) -> List[Path]:
    return sorted([p for p in area_dir.iterdir() if p.is_dir()], key=category_sort_key)


def iter_doc_files(docs_root: Path) -> Iterable[Path]:
    for file_path in docs_root.rglob("*.md"):
        if file_path.name == "00.00_index.md" or file_path.name.endswith("_index.md"):
            continue
        yield file_path


def write_category_index(category_dir: Path, docs_root: Path) -> None:
    docs = []
    for file_path in category_dir.glob("*.md"):
        if file_path.name.endswith("_index.md"):
            continue
        post = frontmatter.load(file_path)
        title = (
            post.metadata.get("title")
            or extract_title(post.content)
            or display_fallback_title(file_path.stem)
        )
        doc_id = post.metadata.get("id") or extract_id(file_path.stem)
        docs.append((file_path, title, doc_id))

    docs.sort(key=lambda item: doc_sort_key(item[2], item[0].stem))

    header = f"# {display_category_name(category_dir.name)} Index"
    lines = [header, "", "## Documents"]
    if docs:
        for file_path, title, _doc_id in docs:
            lines.append(f"- [[{file_path.stem}]] - {title}")
    else:
        lines.append("- None")

    lines.extend(
        [
            "",
            "## Related",
            "- [[00.00_index|Master Index]]",
            "",
            "## Work Efforts",
            "- None",
        ]
    )

    index_path = category_dir / f"{category_dir.name}_index.md"
    index_path.write_text("\n".join(lines).rstrip() + "\n")


def write_master_index(docs_root: Path) -> None:
    lines = ["# Master Index", "", "## Areas"]
    area_dirs = iter_area_dirs(docs_root)
    if not area_dirs:
        lines.append("- None")

    for area_dir in area_dirs:
        lines.append(f"### {display_area_name(area_dir.name)}")
        category_dirs = iter_category_dirs(area_dir)
        if category_dirs:
            for category_dir in category_dirs:
                label = display_category_name(category_dir.name)
                link_target = (
                    f"{area_dir.name}/{category_dir.name}/{category_dir.name}_index"
                )
                lines.append(f"- [[{link_target}|{label}]]")
        else:
            lines.append("- None")

    index_path = docs_root / "00.00_index.md"
    index_path.write_text("\n".join(lines).rstrip() + "\n")


def clean_links(links: List[str], stems: set, relpaths: set) -> Tuple[List[str], List[str]]:
    cleaned = []
    removed = []
    for link in links:
        target = extract_link_target(link)
        if link_target_exists(target, stems, relpaths):
            if link not in cleaned:
                cleaned.append(link)
        else:
            removed.append(link)
    return cleaned, removed


def fix_broken_links(docs_root: Path, repo_root: Path) -> List[str]:
    stems, relpaths = collect_repo_index(repo_root)
    broken = []
    for file_path in iter_doc_files(docs_root):
        post = frontmatter.load(file_path)
        changed = False
        for key in ("links", "related_work_efforts"):
            original = ensure_list(post.metadata.get(key))
            if not original:
                continue
            cleaned, removed = clean_links(original, stems, relpaths)
            if cleaned != original:
                post.metadata[key] = cleaned
                changed = True
                for link in removed:
                    broken.append(f"{file_path}: {link}")
        if changed:
            post.metadata["updated"] = iso_now()
            file_path.write_text(frontmatter.dumps(post))
    return broken


def compute_health(repo_root: Path, docs_root: Path) -> Tuple[int, List[str], List[str], List[str]]:
    stems, relpaths = collect_repo_index(repo_root)
    missing_meta = []
    broken_links = []
    orphaned = []

    category_index_cache = {}

    for doc_file in iter_doc_files(docs_root):
        post = frontmatter.load(doc_file)
        missing_fields = [
            field
            for field in ("id", "title", "created", "updated")
            if field not in post.metadata
        ]
        if missing_fields:
            missing_meta.append(
                f"{doc_file}: missing {', '.join(missing_fields)}"
            )

        for key in ("links", "related_work_efforts"):
            for link in ensure_list(post.metadata.get(key)):
                target = extract_link_target(link)
                if not link_target_exists(target, stems, relpaths):
                    broken_links.append(f"{doc_file}: {link}")

        category_dir = doc_file.parent
        index_path = category_dir / f"{category_dir.name}_index.md"
        if index_path not in category_index_cache:
            if index_path.exists():
                category_index_cache[index_path] = index_path.read_text()
            else:
                category_index_cache[index_path] = None
        index_content = category_index_cache[index_path]
        if not index_content or f"[[{doc_file.stem}]]" not in index_content:
            orphaned.append(str(doc_file))

    score = 100 - len(missing_meta) * 5 - len(broken_links) * 2 - len(orphaned) * 3
    score = max(score, 0)
    return score, missing_meta, broken_links, orphaned


def format_health_report(
    score: int, missing_meta: List[str], broken_links: List[str], orphaned: List[str]
) -> str:
    lines = [f"Health score: {score}/100", ""]
    lines.append(f"Missing metadata: {len(missing_meta)}")
    if missing_meta:
        lines.extend(missing_meta)
    else:
        lines.append("None")

    lines.append("")
    lines.append(f"Broken links: {len(broken_links)}")
    if broken_links:
        lines.extend(broken_links)
    else:
        lines.append("None")

    lines.append("")
    lines.append(f"Orphaned docs: {len(orphaned)}")
    if orphaned:
        lines.extend(orphaned)
    else:
        lines.append("None")

    return "\n".join(lines)


def make_wiki_link(path: Path, repo_root: Path) -> str:
    rel = path.relative_to(repo_root).with_suffix("").as_posix()
    return f"[[{rel}]]"


def find_repo_root_from_doc(doc_path: Path) -> Path:
    parts = doc_path.resolve().parts
    if DOCS_DIRNAME not in parts:
        raise ValueError("doc_path must be inside a _docs directory")
    idx = parts.index(DOCS_DIRNAME)
    return Path(*parts[:idx])


def resolve_work_effort_path(repo_root: Path, work_effort_id: str) -> Path:
    raw = work_effort_id.strip()
    if raw.lower().endswith(".md"):
        raw = raw[:-3]

    candidate = Path(raw).expanduser()
    if candidate.is_absolute() and candidate.exists():
        return candidate

    candidate = repo_root / raw
    if candidate.exists():
        return candidate

    work_root = repo_root / WORK_EFFORTS_DIRNAME
    if not work_root.exists():
        raise ValueError("_work_efforts directory not found")

    matches = [
        path
        for path in work_root.rglob("*.md")
        if path.stem.startswith(raw)
    ]
    if not matches:
        raise ValueError(f"No work effort found for id: {work_effort_id}")
    if len(matches) > 1:
        match_list = "\n".join(str(path) for path in matches)
        raise ValueError(f"Multiple work efforts matched:\n{match_list}")
    return matches[0]


@mcp.tool()
def initialize_docs(repo_path: str) -> str:
    """Create the _docs structure and master index."""
    docs_root = resolve_docs_root(repo_path)
    docs_root.mkdir(parents=True, exist_ok=True)

    created = []
    for area_dir_name in DEFAULT_AREAS.values():
        area_dir = docs_root / area_dir_name
        if not area_dir.exists():
            area_dir.mkdir(parents=True, exist_ok=True)
            created.append(str(area_dir))

    index_path = docs_root / "00.00_index.md"
    if not index_path.exists():
        write_master_index(docs_root)

    details = "\n".join(created) if created else "(no new area folders)"
    return f"Initialized docs at {docs_root}\nCreated:\n{details}"


@mcp.tool()
def create_doc(
    repo_path: str, area: str, category: str, title: str, content: str
) -> str:
    """Create a new doc with Johnny Decimal numbering and update indexes."""
    docs_root = resolve_docs_root(repo_path)
    if not docs_root.exists():
        raise ValueError("_docs directory not found; run initialize_docs first")

    area_dir = resolve_area_dir(docs_root, area)
    category_dir = resolve_category_dir(area_dir, category)

    doc_id = get_next_id(category_dir)
    slug = slugify(title)
    filename = f"{doc_id}_{slug}.md"
    file_path = category_dir / filename
    counter = 1
    while file_path.exists():
        filename = f"{doc_id}_{slug}_{counter}.md"
        file_path = category_dir / filename
        counter += 1

    now = iso_now()
    metadata = {
        "id": doc_id,
        "title": title,
        "created": now,
        "updated": now,
        "links": ["[[00.00_index]]", f"[[{category_dir.name}_index]]"],
        "related_work_efforts": [],
    }

    body = content.strip() if content else f"# {title}\n\n"
    post = frontmatter.Post(body + "\n", **metadata)
    file_path.write_text(frontmatter.dumps(post))

    write_category_index(category_dir, docs_root)
    write_master_index(docs_root)

    return f"Created {doc_id} - {title}\nPath: {file_path}"


@mcp.tool()
def update_doc(
    file_path: str, content: Optional[str] = None, add_links: Optional[List[str]] = None
) -> str:
    """Update a doc's content, links, and updated timestamp."""
    doc_path = Path(file_path).expanduser().resolve()
    if not doc_path.exists():
        raise ValueError("file_path not found")

    post = frontmatter.load(doc_path)
    if content is not None:
        post.content = content

    if add_links:
        if isinstance(add_links, str):
            add_links = [add_links]
        links = ensure_list(post.metadata.get("links"))
        for link in add_links:
            if link not in links:
                links.append(link)
        post.metadata["links"] = links

    post.metadata["updated"] = iso_now()
    doc_path.write_text(frontmatter.dumps(post))

    return f"Updated {doc_path}"


@mcp.tool()
def rebuild_indices(repo_path: str) -> str:
    """Regenerate all index files, clean broken links, and report health."""
    docs_root = resolve_docs_root(repo_path)
    repo_root = Path(repo_path).expanduser().resolve()
    if not docs_root.exists():
        raise ValueError("_docs directory not found")

    category_count = 0
    for area_dir in iter_area_dirs(docs_root):
        for category_dir in iter_category_dirs(area_dir):
            write_category_index(category_dir, docs_root)
            category_count += 1

    write_master_index(docs_root)

    broken = fix_broken_links(docs_root, repo_root)
    score, missing_meta, broken_links, orphaned = compute_health(repo_root, docs_root)

    report = [
        f"Rebuilt {category_count} category index files",
        f"Removed {len(broken)} broken links",
        "",
        format_health_report(score, missing_meta, broken_links, orphaned),
    ]
    return "\n".join(report)


@mcp.tool()
def link_work_effort(doc_path: str, work_effort_id: str) -> str:
    """Link a doc to a work effort with bidirectional frontmatter updates."""
    doc_file = Path(doc_path).expanduser().resolve()
    if not doc_file.exists():
        raise ValueError("doc_path not found")

    repo_root = find_repo_root_from_doc(doc_file)
    work_effort_path = resolve_work_effort_path(repo_root, work_effort_id)

    doc_post = frontmatter.load(doc_file)
    related = ensure_list(doc_post.metadata.get("related_work_efforts"))
    work_link = make_wiki_link(work_effort_path, repo_root)
    if work_link not in related:
        related.append(work_link)
    doc_post.metadata["related_work_efforts"] = related
    doc_post.metadata["updated"] = iso_now()
    doc_file.write_text(frontmatter.dumps(doc_post))

    effort_post = frontmatter.load(work_effort_path)
    related_docs = ensure_list(effort_post.metadata.get("related_docs"))
    doc_link = make_wiki_link(doc_file, repo_root)
    if doc_link not in related_docs:
        related_docs.append(doc_link)
    effort_post.metadata["related_docs"] = related_docs

    if "last_updated" in effort_post.metadata:
        effort_post.metadata["last_updated"] = iso_now()
    elif "updated" in effort_post.metadata:
        effort_post.metadata["updated"] = iso_now()
    else:
        effort_post.metadata["updated"] = iso_now()

    work_effort_path.write_text(frontmatter.dumps(effort_post))

    return f"Linked {doc_file} <-> {work_effort_path}"


@mcp.tool()
def search_docs(repo_path: str, query: str, search_content: bool = True) -> str:
    """Search titles, content, and frontmatter in _docs."""
    docs_root = resolve_docs_root(repo_path)
    if not docs_root.exists():
        raise ValueError("_docs directory not found")

    needle = query.lower()
    results = []

    for doc_file in iter_doc_files(docs_root):
        post = frontmatter.load(doc_file)
        title = (
            post.metadata.get("title")
            or extract_title(post.content)
            or display_fallback_title(doc_file.stem)
        )
        meta_text = "\n".join(
            f"{key}: {value}" for key, value in post.metadata.items()
        ).lower()

        haystacks = [title.lower(), meta_text]
        if search_content:
            haystacks.append(post.content.lower())

        if any(needle in haystack for haystack in haystacks):
            doc_id = post.metadata.get("id") or extract_id(doc_file.stem) or doc_file.stem
            results.append(
                f"- {doc_id} - {title}\n  Path: {doc_file}"
            )

    if not results:
        return f"No documents found for '{query}'"

    return f"Found {len(results)} document(s) for '{query}':\n" + "\n".join(results)


@mcp.tool()
def check_health(repo_path: str) -> str:
    """Return documentation health score and issue list."""
    docs_root = resolve_docs_root(repo_path)
    repo_root = Path(repo_path).expanduser().resolve()
    if not docs_root.exists():
        raise ValueError("_docs directory not found")

    score, missing_meta, broken_links, orphaned = compute_health(repo_root, docs_root)
    return format_health_report(score, missing_meta, broken_links, orphaned)


if __name__ == "__main__":
    mcp.run()
