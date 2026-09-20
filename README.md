# 哈萨克文转写器

可转写出各种形式的哈萨克文，包括阿拉伯哈文（Cn-Ar），新哈文（Cn-Nw），中国拉丁哈文（Cn-La），汉语拼音式转写（Cn-Py），西里尔哈文（Kz-Cy），哈萨克斯坦2017版拉丁转写草稿（Kz-17.0），哈萨克斯坦2017版正式拉丁转写（Kz-17），哈萨克斯坦2018版拉丁转写（Kz-18），哈萨克斯坦2017版拉丁转写（Kz-21）
点击右下角按钮可复制结果
内置两种字体模式，可根据个人喜好切换
内置日间/夜间模式
使用DeepSeek V4 Flash制作

未接入词库文件，肯定有转写错误，当前技术有限，请见谅

以下为大肥鱼自己生成的ReadMe内容

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
