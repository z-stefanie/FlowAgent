---
name: pdf-merge-split
description: >-
  Merge multiple PDF files into one or split a PDF by page ranges using pypdf.
  Use when the user mentions merging PDFs, splitting PDFs, extracting pages,
  combining documents, or any PDF page manipulation task.
---

# PDF Merge & Split

Use **pypdf** for all PDF merge/split operations. Install if missing:

```bash
pip install pypdf
```

## Merge PDFs

```python
from pypdf import PdfWriter

writer = PdfWriter()
for pdf_path in pdf_files:
    writer.append(pdf_path)
writer.write("merged.pdf")
writer.close()
```

Key points:
- `append()` accepts file paths, file objects, or `PdfReader` instances
- Files are merged in the order of the list
- To append only specific pages: `writer.append(path, pages=(start, end))`

## Split PDF

### Extract a page range

```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("input.pdf")
writer = PdfWriter()
for page_num in range(start, end):  # 0-indexed
    writer.add_page(reader.pages[page_num])
writer.write("output.pdf")
writer.close()
```

### Split into single-page files

```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("input.pdf")
for i, page in enumerate(reader.pages):
    writer = PdfWriter()
    writer.add_page(page)
    writer.write(f"page_{i + 1}.pdf")
    writer.close()
```

### Split by custom ranges

```python
from pypdf import PdfReader, PdfWriter

ranges = [(0, 3), (3, 7), (7, 10)]  # 0-indexed, end exclusive
reader = PdfReader("input.pdf")
for idx, (start, end) in enumerate(ranges):
    writer = PdfWriter()
    for page_num in range(start, end):
        writer.add_page(reader.pages[page_num])
    writer.write(f"part_{idx + 1}.pdf")
    writer.close()
```

## Common patterns

- Get total page count: `len(PdfReader("file.pdf").pages)`
- Always call `writer.close()` after writing to release file handles
- Page indices are **0-based** (page 1 = index 0)
- When the user says "pages 3-5", convert to 0-indexed range `(2, 5)`

## Error handling

```python
from pypdf import PdfReader
from pypdf.errors import PdfReadError

try:
    reader = PdfReader("file.pdf")
except FileNotFoundError:
    print("File not found")
except PdfReadError:
    print("Invalid or corrupted PDF")
```

## Additional resources

- For more usage examples, see [examples.md](examples.md)
