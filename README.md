# Qazaq Script Transcriber

A dependency-free browser tool for converting between nine Kazakh writing systems:

- Cn-Ar
- Cn-La
- Cn-Nw
- Cn-Py
- Kz-Cy
- Kz-17.0
- Kz-17
- Kz-18
- Kz-21

## Preview

```powershell
npm start
```

Open `http://127.0.0.1:4173`.

## Rules

`rules.js` is generated from `Qazaq.xlsx`. Regenerate it after editing the workbook:

```powershell
python scripts/generate_rules.py
```

## Test

```powershell
npm test
```
