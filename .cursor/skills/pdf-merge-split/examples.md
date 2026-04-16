# PDF Merge & Split Examples

## Example 1: Merge all PDFs in a folder

```python
from pathlib import Path
from pypdf import PdfWriter

pdf_dir = Path("invoices/")
pdf_files = sorted(pdf_dir.glob("*.pdf"))

writer = PdfWriter()
for pdf in pdf_files:
    writer.append(str(pdf))
writer.write("all_invoices.pdf")
writer.close()
print(f"Merged {len(pdf_files)} files into all_invoices.pdf")
```

## Example 2: Extract pages 5-10 from a large report

```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("annual_report.pdf")
writer = PdfWriter()
for page_num in range(4, 10):  # pages 5-10 → indices 4-9
    writer.add_page(reader.pages[page_num])
writer.write("excerpt.pdf")
writer.close()
```

## Example 3: Merge specific pages from multiple files

```python
from pypdf import PdfWriter

writer = PdfWriter()
writer.append("cover.pdf")
writer.append("report.pdf", pages=(0, 5))   # first 5 pages
writer.append("appendix.pdf", pages=(2, 8)) # pages 3-8
writer.write("final_document.pdf")
writer.close()
```

## Example 4: Split a PDF into chunks of N pages

```python
import math
from pypdf import PdfReader, PdfWriter

reader = PdfReader("large_document.pdf")
pages_per_chunk = 10
total = len(reader.pages)

for chunk_idx in range(math.ceil(total / pages_per_chunk)):
    writer = PdfWriter()
    start = chunk_idx * pages_per_chunk
    end = min(start + pages_per_chunk, total)
    for page_num in range(start, end):
        writer.add_page(reader.pages[page_num])
    writer.write(f"chunk_{chunk_idx + 1}.pdf")
    writer.close()
    print(f"chunk_{chunk_idx + 1}.pdf: pages {start + 1}-{end}")
```

## Example 5: Remove specific pages from a PDF

```python
from pypdf import PdfReader, PdfWriter

reader = PdfReader("document.pdf")
pages_to_remove = {2, 5, 8}  # 0-indexed pages to skip

writer = PdfWriter()
for i, page in enumerate(reader.pages):
    if i not in pages_to_remove:
        writer.add_page(page)
writer.write("cleaned.pdf")
writer.close()
```
