import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.deps'))
import pymupdf

base = Path(r'D:\Hech\语言文字\Qazaqsha')
for path in base.glob('*.pdf'):
    doc = pymupdf.open(path)
    print(f'FILE {path.name} pages={doc.page_count}')
    print(doc.metadata)
    for index, page in enumerate(doc):
        text = page.get_text('text').strip()
        images = page.get_images(full=True)
        print(f'page {index + 1}: textchars={len(text)} images={len(images)} rect={page.rect}')
        if text:
            print(text[:1000])
