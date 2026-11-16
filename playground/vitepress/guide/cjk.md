# CJK 友好 {#cjk}

vitepress-actview 接入了 `markdown-it-cjk-friendly`，用于改善中文、日文、韩文紧邻强调符时的解析。

## 输入 {#input}

```md
中文**强调**文字

日文**強調**

韩文**강조**
```

## 输出 {#output}

中文**强调**文字

日文**強調**

韩文**강조**

如果没有 CJK friendly，部分文本中的 `**` 可能无法按预期解析。
