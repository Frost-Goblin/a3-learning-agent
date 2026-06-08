# 文件处理与异常调试

## 学习目标

- 能读写文本文件
- 理解文件路径、编码和资源关闭
- 掌握异常捕获的基本写法

## 文件读写

推荐使用 `with open(...)` 管理文件资源。

写文件：

```python
with open("data.txt", "w", encoding="utf-8") as f:
    f.write("hello\n")
```

读文件：

```python
with open("data.txt", "r", encoding="utf-8") as f:
    content = f.read()
    print(content)
```

## 常见模式

- `r`：只读
- `w`：写入，覆盖原文件
- `a`：追加

## 路径意识

- 相对路径依赖当前工作目录
- 初学者经常“文件明明在那，但程序找不到”
- 做项目时应尽量统一数据目录

## 异常处理

当程序运行中出现错误时，可以通过异常处理避免程序直接崩溃。

```python
try:
    num = int(input("请输入整数："))
    print(10 / num)
except ValueError:
    print("输入格式错误")
except ZeroDivisionError:
    print("除数不能为 0")
finally:
    print("程序结束")
```

## 调试意识

调试不是靠猜，而是定位。

建议流程：

1. 复现错误
2. 看报错类型
3. 看报错行
4. 打印关键变量
5. 缩小问题范围

## 常见异常

- `ValueError`
- `TypeError`
- `IndexError`
- `KeyError`
- `FileNotFoundError`
- `ZeroDivisionError`

## 易错点

### 1. 文件编码不一致

读取中文文件时建议显式写 `encoding="utf-8"`。

### 2. 覆盖写误删原数据

使用 `w` 前应确认是否需要保留原内容。

### 3. `except` 写得过宽

新手常用裸 `except`，这会隐藏真实错误原因。

### 4. 只会看“程序错了”，不会读报错信息

这是调试能力薄弱的典型表现。

## 实验建议

1. 实现一个成绩写入文本文件的小程序。
2. 从文件中读取学生成绩并计算平均分。
3. 输入异常数据，观察不同异常类型。
4. 为文件读取程序补充错误处理逻辑。

## 检索关键词

- 文件读写
- 编码
- try except
- 调试
- 异常类型
