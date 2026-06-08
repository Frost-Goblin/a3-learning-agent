# 函数与模块

## 学习目标

- 理解为什么要把代码封装成函数
- 掌握参数、返回值和作用域
- 会使用模块组织项目代码

## 函数的作用

函数用于封装重复逻辑，提高代码复用性和可读性。

示例：

```python
def calc_area(width, height):
    area = width * height
    return area
```

调用：

```python
result = calc_area(5, 3)
print(result)
```

## 参数类型

- 位置参数
- 默认参数
- 关键字参数

```python
def greet(name, title="同学"):
    return f"{title}，你好，{name}"
```

## 返回值

返回值表示函数处理后的结果。没有显式 `return` 时，默认返回 `None`。

## 变量作用域

- 函数内部定义的是局部变量
- 函数外部定义的是全局变量

错误理解常见于：以为函数里修改局部变量会自动影响外部同名变量。

## 模块基础

模块是一个 Python 文件，可将相关函数放在一起统一管理。

示例：

```python
import math
print(math.sqrt(16))
```

也可以导入自定义模块：

```python
from utils import calc_area
```

## 组织代码的基本原则

1. 一个函数只做一件事
2. 函数名要表达动作
3. 重复代码优先抽成函数
4. 多个功能相关的函数可放入同一模块

## 易错点

### 1. 函数定义了但没调用

### 2. 只打印结果，不返回结果

如果函数内部 `print()` 了结果，但没有 `return`，其他函数无法继续使用该结果。

### 3. 参数个数不匹配

### 4. 把所有代码都堆在主程序里

这是从“会写代码”到“会组织代码”的关键分水岭。

## 典型教学任务

1. 封装求最大值函数
2. 封装成绩等级判断函数
3. 编写菜单显示函数
4. 将学生信息处理功能拆入独立模块

## 小案例

```python
def get_average(scores):
    return sum(scores) / len(scores)

def judge_level(avg):
    if avg >= 90:
        return "优秀"
    if avg >= 80:
        return "良好"
    if avg >= 60:
        return "及格"
    return "待提升"
```

## 检索关键词

- 函数
- 参数
- 返回值
- 作用域
- 模块导入
- 代码封装
