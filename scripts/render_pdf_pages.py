import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd() / '.deps'))
import pymupdf
base = Path(r'D:\Hech\语言文字\Qazaqsha')
out = Path.cwd() / 'pdf-renders'
out.mkdir(exist_ok=True)
for pi, path in enumerate(base.glob('*.pdf'), 1):
    doc = pymupdf.open(path)
    stem = f'pdf{pi}'
    for index in range(min(4, doc.page_count)):
        page = doc[index]
        pix = page.get_pixmap(matrix=pymupdf.Matrix(1.6, 1.6), alpha=False)
        target = out / f'{stem}-page{index+1:02}.png'
        pix.save(target)
        print(target)
