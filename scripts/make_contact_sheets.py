import sys
from pathlib import Path
sys.path.insert(0, str(Path.cwd() / '.deps'))
import pymupdf
from PIL import Image, ImageDraw
base = Path(r'D:\Hech\语言文字\Qazaqsha')
out = Path.cwd() / 'pdf-renders'
for pi, path in enumerate(base.glob('*.pdf'), 1):
    doc = pymupdf.open(path)
    thumbs=[]
    for page in doc:
        pix=page.get_pixmap(matrix=pymupdf.Matrix(0.5,0.5), alpha=False)
        img=Image.frombytes('RGB',(pix.width,pix.height),pix.samples)
        img.thumbnail((260,368))
        thumbs.append(img.copy())
    cols=5; rows=(len(thumbs)+cols-1)//cols
    sheet=Image.new('RGB',(cols*280,rows*410),'white')
    draw=ImageDraw.Draw(sheet)
    for idx,img in enumerate(thumbs):
        x=(idx%cols)*280+10; y=(idx//cols)*410+25
        sheet.paste(img,(x,y))
        draw.text((x,5+(idx//cols)*410),f'page {idx+1}',fill='black')
    target=out/f'pdf{pi}-contact.png'
    sheet.save(target)
    print(target)
