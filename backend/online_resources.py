from __future__ import annotations

from typing import Any


PYTHON_ONLINE_RESOURCES: list[dict[str, Any]] = [
    {
        "id": "official-tutorial",
        "title": "Python 官方教程（中文）",
        "url": "https://docs.python.org/zh-cn/3/tutorial/index.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "入门启动",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["基础语法", "学习路线"],
        "keywords": ["python", "基础", "语法", "入门", "教程"],
        "summary": "适合从头系统学习 Python，是整套学习路径的总入口。",
    },
    {
        "id": "official-control-flow",
        "title": "Python 官方教程：控制流工具",
        "url": "https://docs.python.org/zh-cn/3/tutorial/controlflow.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["分支循环", "函数"],
        "keywords": ["if", "for", "while", "函数", "控制流"],
        "summary": "覆盖 if、for、while、range、函数定义等核心基础，适合补流程控制。",
    },
    {
        "id": "official-data-structures",
        "title": "Python 官方教程：数据结构",
        "url": "https://docs.python.org/zh-cn/3/tutorial/datastructures.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["列表字典", "字符串"],
        "keywords": ["列表", "字典", "元组", "集合", "字符串"],
        "summary": "适合集中补列表、字典、集合和字符串操作，是写题和做项目的基础。",
    },
    {
        "id": "official-modules",
        "title": "Python 官方教程：模块",
        "url": "https://docs.python.org/zh-cn/3/tutorial/modules.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["模块", "工程组织"],
        "keywords": ["模块", "import", "包", "工程"],
        "summary": "适合解决代码会写但不会拆文件、不会组织模块的问题。",
    },
    {
        "id": "official-input-output",
        "title": "Python 官方教程：输入与输出",
        "url": "https://docs.python.org/zh-cn/3/tutorial/inputoutput.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["文件处理", "字符串", "json"],
        "keywords": ["文件", "读写", "json", "格式化", "输入", "输出"],
        "summary": "适合补文件读写、文本处理、JSON 存取，是做数据处理和脚本的核心部分。",
    },
    {
        "id": "official-errors",
        "title": "Python 官方教程：错误和异常",
        "url": "https://docs.python.org/zh-cn/3/tutorial/errors.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["异常处理", "调试"],
        "keywords": ["异常", "try", "except", "报错", "调试"],
        "summary": "适合解决一报错就卡住的问题，尤其适合文件、网络和数据清洗场景。",
    },
    {
        "id": "official-classes",
        "title": "Python 官方教程：类",
        "url": "https://docs.python.org/zh-cn/3/tutorial/classes.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "intermediate",
        "phase": "进阶拓展",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["面向对象"],
        "keywords": ["类", "对象", "封装", "继承", "面向对象"],
        "summary": "适合从脚本阶段走向结构化项目时补面向对象基础。",
    },
    {
        "id": "official-csv",
        "title": "Python 标准库：csv",
        "url": "https://docs.python.org/zh-cn/3/library/csv.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "intermediate",
        "phase": "项目实战",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["文件处理", "数据处理"],
        "keywords": ["csv", "表格", "读写", "数据", "文件"],
        "summary": "适合正在做表格、成绩单、日志等 CSV 处理任务的人。",
    },
    {
        "id": "official-json",
        "title": "Python 标准库：json",
        "url": "https://docs.python.org/zh-cn/3/library/json.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "intermediate",
        "phase": "项目实战",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["数据处理", "接口数据"],
        "keywords": ["json", "数据", "接口", "序列化"],
        "summary": "适合处理接口返回、配置文件和结构化数据保存场景。",
    },
    {
        "id": "official-pathlib",
        "title": "Python 标准库：pathlib",
        "url": "https://docs.python.org/zh-cn/3/library/pathlib.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "intermediate",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["文件处理", "工程组织"],
        "keywords": ["pathlib", "路径", "文件", "目录", "path"],
        "summary": "适合总在相对路径、绝对路径、目录遍历上卡住的人，能把文件路径处理理顺。",
    },
    {
        "id": "official-open",
        "title": "Python 内置函数：open",
        "url": "https://docs.python.org/zh-cn/3/library/functions.html#open",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["文件处理"],
        "keywords": ["open", "with", "编码", "读取", "写入"],
        "summary": "适合想把 open、模式参数、编码和异常处理一次看清楚的人。",
    },
    {
        "id": "official-if-for-range",
        "title": "官方小节：if / for / range 基础控制流",
        "url": "https://docs.python.org/zh-cn/3/tutorial/controlflow.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "入门启动",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["分支循环", "基础语法"],
        "keywords": ["if", "elif", "else", "for", "while", "range", "循环"],
        "summary": "适合卡在 if、for、while、range 这些基础控制流概念上的人。",
    },
    {
        "id": "official-functions-params",
        "title": "官方小节：函数定义、参数和返回值",
        "url": "https://docs.python.org/zh-cn/3/tutorial/controlflow.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["函数", "基础语法"],
        "keywords": ["def", "return", "参数", "默认参数", "关键字参数", "位置参数"],
        "summary": "适合总在 def、return、默认参数、关键字参数上混淆的人。",
    },
    {
        "id": "official-list-methods",
        "title": "官方小节：列表方法 append / insert / pop / sort",
        "url": "https://docs.python.org/zh-cn/3/tutorial/datastructures.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["列表方法", "列表字典"],
        "keywords": ["append", "extend", "insert", "remove", "pop", "sort", "reverse", "列表"],
        "summary": "适合明明知道列表能改，但记不住 append、pop、sort 这些方法区别的人。",
    },
    {
        "id": "official-list-comprehension",
        "title": "官方小节：列表推导式",
        "url": "https://docs.python.org/zh-cn/3/tutorial/datastructures.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["列表推导式", "基础语法"],
        "keywords": ["列表推导式", "comprehension", "推导式", "for", "if"],
        "summary": "适合看得懂普通循环，但一碰列表推导式就发懵的人。",
    },
    {
        "id": "official-dict-basics",
        "title": "官方小节：字典访问、更新与遍历",
        "url": "https://docs.python.org/zh-cn/3/tutorial/datastructures.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["字典操作", "列表字典"],
        "keywords": ["dict", "字典", "keys", "values", "items", "get", "update"],
        "summary": "适合总把字典取值、更新、遍历写乱的人。",
    },
    {
        "id": "official-looping-techniques",
        "title": "官方小节：enumerate / zip / items 循环技巧",
        "url": "https://docs.python.org/zh-cn/3/tutorial/datastructures.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["循环技巧", "分支循环"],
        "keywords": ["enumerate", "zip", "items", "循环", "遍历", "索引"],
        "summary": "适合知道 for 循环，但不会用 enumerate、zip、items 写干净代码的人。",
    },
    {
        "id": "official-strings-format",
        "title": "官方小节：f-string 与字符串格式化",
        "url": "https://docs.python.org/zh-cn/3/tutorial/inputoutput.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["字符串", "基础语法"],
        "keywords": ["f-string", "format", "字符串", "格式化", "print"],
        "summary": "适合输出结果总是拼不对、格式化写得乱的人。",
    },
    {
        "id": "official-file-read-write",
        "title": "官方小节：文件读取与写入",
        "url": "https://docs.python.org/zh-cn/3/tutorial/inputoutput.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["文件读取", "文件处理"],
        "keywords": ["read", "readline", "readlines", "write", "文件读取", "文件写入"],
        "summary": "适合想分清 read、readline、readlines、write 各自用途的人。",
    },
    {
        "id": "official-try-except",
        "title": "官方小节：try / except / finally 异常处理",
        "url": "https://docs.python.org/zh-cn/3/tutorial/errors.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["异常处理", "调试"],
        "keywords": ["try", "except", "finally", "raise", "异常", "报错"],
        "summary": "适合程序一报错就断掉，还不会补 try/except 的人。",
    },
    {
        "id": "official-csv-reader-writer",
        "title": "官方小节：csv.reader / csv.writer",
        "url": "https://docs.python.org/zh-cn/3/library/csv.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "intermediate",
        "phase": "项目实战",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["CSV 读写", "文件处理"],
        "keywords": ["csv.reader", "csv.writer", "reader", "writer", "csv", "表格"],
        "summary": "适合第一次处理 CSV，想先把 reader 和 writer 用法弄明白的人。",
    },
    {
        "id": "official-csv-dict",
        "title": "官方小节：DictReader / DictWriter",
        "url": "https://docs.python.org/zh-cn/3/library/csv.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "intermediate",
        "phase": "项目实战",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["CSV 读写", "数据处理"],
        "keywords": ["DictReader", "DictWriter", "表头", "字段名", "csv", "字典"],
        "summary": "适合已经会普通 CSV 读写，想进一步按字段名处理表格数据的人。",
    },
    {
        "id": "official-json-load-dump",
        "title": "官方小节：json.load / json.dump / loads / dumps",
        "url": "https://docs.python.org/zh-cn/3/library/json.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "intermediate",
        "phase": "项目实战",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["JSON 读写", "数据处理"],
        "keywords": ["json.load", "json.dump", "loads", "dumps", "json", "序列化"],
        "summary": "适合总记不清 load 和 loads、dump 和 dumps 区别的人。",
    },
    {
        "id": "official-pathlib-ops",
        "title": "官方小节：Path 拼接、exists、glob、read_text",
        "url": "https://docs.python.org/zh-cn/3/library/pathlib.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "intermediate",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["路径处理", "文件处理"],
        "keywords": ["Path", "exists", "glob", "read_text", "write_text", "路径处理"],
        "summary": "适合总把字符串路径写乱，想学会更稳的 Path 风格文件操作的人。",
    },
    {
        "id": "official-venv",
        "title": "Python 官方教程：虚拟环境和包",
        "url": "https://docs.python.org/zh-cn/3/tutorial/venv.html",
        "provider": "官方文档",
        "kind": "documentation",
        "level": "intermediate",
        "phase": "进阶拓展",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["环境管理", "工具"],
        "keywords": ["venv", "pip", "环境", "依赖", "安装"],
        "summary": "适合从单文件脚本走向真实项目时补环境管理能力。",
    },
    {
        "id": "python-100-days",
        "title": "Python - 100 天从新手到大师",
        "url": "https://github.com/jackfrued/Python-100-Days",
        "provider": "GitHub",
        "kind": "repository",
        "level": "beginner",
        "phase": "入门启动",
        "focus_tags": ["讲解", "练习", "复习"],
        "topic_tags": ["学习路线", "基础语法", "项目实战"],
        "keywords": ["100天", "入门", "路线", "练习", "项目"],
        "summary": "覆盖基础到项目的完整路径，适合长期按阶段推进学习。",
    },
    {
        "id": "python-learning-chinese",
        "title": "中文 Python 学习指南",
        "url": "https://github.com/ShreckYe/python-learning-chinese",
        "provider": "GitHub",
        "kind": "repository",
        "level": "beginner",
        "phase": "入门启动",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["学习路线", "工具"],
        "keywords": ["指南", "路线", "入门", "工具"],
        "summary": "适合先搭学习地图，知道每个阶段先学什么、后学什么。",
    },
    {
        "id": "python-tips",
        "title": "Python Tips",
        "url": "https://github.com/satwikkansal/wtfpython",
        "provider": "GitHub",
        "kind": "repository",
        "level": "intermediate",
        "phase": "进阶拓展",
        "focus_tags": ["复习", "练习"],
        "topic_tags": ["易错点", "语言细节"],
        "keywords": ["坑", "细节", "陷阱", "进阶", "语言特性"],
        "summary": "适合基础过后查缺补漏，集中认识 Python 常见坑和语言细节。",
    },
    {
        "id": "thealgorithms-python",
        "title": "TheAlgorithms / Python",
        "url": "https://github.com/TheAlgorithms/Python",
        "provider": "GitHub",
        "kind": "repository",
        "level": "intermediate",
        "phase": "练习刷题",
        "focus_tags": ["练习", "复习"],
        "topic_tags": ["算法", "数据结构", "代码阅读"],
        "keywords": ["算法", "数据结构", "查找", "排序", "刷题", "代码"],
        "summary": "适合练算法、看实现、对照思路，覆盖查找、排序、图、树等内容。",
    },
    {
        "id": "pegasuswang-algo",
        "title": "Python 中文数据结构和算法教程",
        "url": "https://github.com/PegasusWang/python_data_structures_and_algorithms",
        "provider": "GitHub",
        "kind": "repository",
        "level": "intermediate",
        "phase": "练习刷题",
        "focus_tags": ["讲解", "练习", "复习"],
        "topic_tags": ["算法", "数据结构"],
        "keywords": ["算法", "数据结构", "教程", "练习"],
        "summary": "适合边读中文讲解边写代码，对算法初学者更友好。",
    },
    {
        "id": "python-data-science-handbook",
        "title": "Python Data Science Handbook",
        "url": "https://github.com/jakevdp/PythonDataScienceHandbook",
        "provider": "GitHub",
        "kind": "repository",
        "level": "intermediate",
        "phase": "进阶拓展",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["数据处理", "数据分析"],
        "keywords": ["numpy", "pandas", "matplotlib", "数据分析"],
        "summary": "适合从基础 Python 走向数据分析方向，覆盖 NumPy、pandas 和可视化。",
    },
    {
        "id": "practical-python",
        "title": "Practical Python Programming",
        "url": "https://github.com/dabeaz-course/practical-python",
        "provider": "GitHub",
        "kind": "repository",
        "level": "intermediate",
        "phase": "项目实战",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["项目实战", "综合练习"],
        "keywords": ["项目", "练习", "文件", "数据", "实战"],
        "summary": "适合想从零散语法练习走到完整小项目的人，内容偏实战和代码组织。",
    },
    {
        "id": "pandas-cookbook",
        "title": "pandas-cookbook",
        "url": "https://github.com/jvns/pandas-cookbook",
        "provider": "GitHub",
        "kind": "repository",
        "level": "intermediate",
        "phase": "项目实战",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["数据处理", "数据分析"],
        "keywords": ["pandas", "csv", "dataframe", "数据处理", "练习"],
        "summary": "适合边看 Notebook 边上手，直接练习 pandas 读取、清洗和分析。",
    },
    {
        "id": "pandas-exercises",
        "title": "pandas_exercises",
        "url": "https://github.com/guipsamora/pandas_exercises",
        "provider": "GitHub",
        "kind": "repository",
        "level": "intermediate",
        "phase": "练习刷题",
        "focus_tags": ["练习", "复习"],
        "topic_tags": ["数据处理", "综合练习"],
        "keywords": ["pandas", "练习", "dataframe", "数据处理", "题"],
        "summary": "适合已经会基础语法，想通过一题一题把 pandas 常见操作练熟的人。",
    },
    {
        "id": "pcc-2e",
        "title": "Python Crash Course 配套资源",
        "url": "https://github.com/ehmatthes/pcc_2e",
        "provider": "GitHub",
        "kind": "repository",
        "level": "beginner",
        "phase": "项目实战",
        "focus_tags": ["练习", "讲解"],
        "topic_tags": ["项目实战", "综合练习"],
        "keywords": ["项目", "综合", "实战", "练习"],
        "summary": "适合在学完基础后通过小项目把知识串起来。",
    },
    {
        "id": "awesome-python",
        "title": "Awesome Python",
        "url": "https://github.com/vinta/awesome-python",
        "provider": "GitHub",
        "kind": "repository",
        "level": "intermediate",
        "phase": "进阶拓展",
        "focus_tags": ["复习", "讲解"],
        "topic_tags": ["工具", "框架", "扩展阅读"],
        "keywords": ["工具", "框架", "扩展", "库"],
        "summary": "适合进阶时了解 Python 生态，找到后续项目和方向所需的库。",
    },
    {
        "id": "bilibili-basic-course",
        "title": "Python 入门基础教程（Bilibili）",
        "url": "https://www.bilibili.com/video/BV12y4y1V73E/",
        "provider": "Bilibili",
        "kind": "video",
        "level": "beginner",
        "phase": "入门启动",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["基础语法", "学习路线"],
        "keywords": ["视频", "入门", "基础", "语法"],
        "summary": "适合先通过视频建立直觉，快速进入 Python 学习状态。",
    },
    {
        "id": "bilibili-full-course",
        "title": "Python 系统课程（Bilibili）",
        "url": "https://www.bilibili.com/video/BV1at41137um/",
        "provider": "Bilibili",
        "kind": "video",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["基础语法", "函数", "文件处理", "面向对象"],
        "keywords": ["视频", "系统课", "函数", "文件", "面向对象"],
        "summary": "覆盖从语法到文件处理、面向对象的系统内容，适合成套补课。",
    },
    {
        "id": "bilibili-file-search",
        "title": "Bilibili：Python 文件操作教程",
        "url": "https://www.bilibili.com/video/BV12h4y1b7HD/",
        "provider": "Bilibili",
        "kind": "video",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["文件处理"],
        "keywords": ["文件", "读写", "csv", "文本"],
        "summary": "适合集中补文件读写、CSV、文本处理这类高频痛点。",
    },
    {
        "id": "bilibili-pandas-search",
        "title": "Bilibili：Pandas 数据处理从入门到实战",
        "url": "https://www.bilibili.com/video/BV1LhWCzsEPj/",
        "provider": "Bilibili",
        "kind": "video",
        "level": "intermediate",
        "phase": "项目实战",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["数据处理", "数据分析"],
        "keywords": ["pandas", "数据处理", "数据分析", "csv"],
        "summary": "适合从基础脚本迈向真实数据清洗和分析任务。",
    },
    {
        "id": "bilibili-pandas-ant",
        "title": "Bilibili：Pandas 数据分析从入门到实战",
        "url": "https://www.bilibili.com/video/BV1UJ411A7Fs/",
        "provider": "Bilibili",
        "kind": "video",
        "level": "intermediate",
        "phase": "项目实战",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["数据处理", "数据分析"],
        "keywords": ["pandas", "数据分析", "dataframe", "csv"],
        "summary": "适合系统补 pandas，课程里直接覆盖数据读取、查询、分组、透视和合并。",
    },
    {
        "id": "bilibili-json-direct",
        "title": "Bilibili：使用 json 模块处理 JSON 数据",
        "url": "https://www.bilibili.com/video/BV1cBrvBzEYY/",
        "provider": "Bilibili",
        "kind": "video",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["数据处理", "接口数据"],
        "keywords": ["json", "接口", "数据", "序列化"],
        "summary": "适合总在 JSON 读写、接口返回解析和字典结构转换上卡住的人。",
    },
    {
        "id": "bilibili-oop-direct",
        "title": "Bilibili：Python 面向对象（2025版）",
        "url": "https://www.bilibili.com/video/BV1FME7z2Ec4/",
        "provider": "Bilibili",
        "kind": "video",
        "level": "intermediate",
        "phase": "进阶拓展",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["面向对象"],
        "keywords": ["类", "对象", "__init__", "继承", "多态"],
        "summary": "适合已经会写脚本，想把类、对象、继承、多态真正讲透的人。",
    },
    {
        "id": "bilibili-algo-plain",
        "title": "Bilibili：数据结构与算法 Python 版（通俗易懂）",
        "url": "https://www.bilibili.com/video/BV1vX4y1G7aU/",
        "provider": "Bilibili",
        "kind": "video",
        "level": "intermediate",
        "phase": "练习刷题",
        "focus_tags": ["讲解", "练习", "复习"],
        "topic_tags": ["算法", "数据结构"],
        "keywords": ["算法", "链表", "栈", "队列", "树"],
        "summary": "适合先把数据结构和常见算法思路听明白，再回头自己敲实现。",
    },
    {
        "id": "bilibili-algo-search",
        "title": "Bilibili：Python 数据结构与算法课程",
        "url": "https://www.bilibili.com/video/BV1e4411s7Kw/",
        "provider": "Bilibili",
        "kind": "video",
        "level": "intermediate",
        "phase": "练习刷题",
        "focus_tags": ["讲解", "练习", "复习"],
        "topic_tags": ["算法", "数据结构"],
        "keywords": ["算法", "刷题", "查找", "排序"],
        "summary": "适合在写题前先看思路讲解，再回去自己实现。",
    },
    {
        "id": "csdn-file-io",
        "title": "Python 文件读写详解（CSDN）",
        "url": "https://blog.csdn.net/m0_61394395/article/details/134379624",
        "provider": "CSDN",
        "kind": "article",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["文件处理"],
        "keywords": ["文件", "读写", "open", "with", "文本"],
        "summary": "适合卡在 open、with、编码、路径这些具体问题上的学习者。",
    },
    {
        "id": "csdn-pandas-intro",
        "title": "使用 pandas 进行数据处理（CSDN）",
        "url": "https://blog.csdn.net/m0_69097184/article/details/155988421",
        "provider": "CSDN",
        "kind": "article",
        "level": "intermediate",
        "phase": "项目实战",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["数据处理", "数据分析"],
        "keywords": ["数据", "pandas", "清洗", "csv", "分析"],
        "summary": "适合想把 Python 用到数据读取、清洗和分析任务中的人。",
    },
    {
        "id": "csdn-open-with",
        "title": "CSDN：open 和 with open() 详细解析",
        "url": "https://blog.csdn.net/weixin_51524504/article/details/140901321",
        "provider": "CSDN",
        "kind": "article",
        "level": "beginner",
        "phase": "基础巩固",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["文件处理"],
        "keywords": ["open", "with", "文件", "编码", "读取", "写入"],
        "summary": "适合想把 open、with、文件模式和编码问题一口气看明白的人。",
    },
    {
        "id": "csdn-pandas-io",
        "title": "CSDN：Pandas 数据读取与写入",
        "url": "https://blog.csdn.net/wudonglianga/article/details/154263288",
        "provider": "CSDN",
        "kind": "article",
        "level": "intermediate",
        "phase": "项目实战",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["数据处理", "数据分析"],
        "keywords": ["pandas", "csv", "json", "excel", "数据读取", "写入"],
        "summary": "适合需要把 CSV、JSON、Excel 读取写入串起来做数据处理的人。",
    },
    {
        "id": "csdn-foundation-search",
        "title": "CSDN：Python 基础语法与数据结构全解析",
        "url": "https://blog.csdn.net/2303_77200324/article/details/153180366",
        "provider": "CSDN",
        "kind": "article",
        "level": "beginner",
        "phase": "入门启动",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["基础语法"],
        "keywords": ["基础", "语法", "入门", "教程"],
        "summary": "适合查找基础语法、变量、循环、函数等短平快解释型文章。",
    },
    {
        "id": "csdn-oop-search",
        "title": "CSDN：Python 面向对象编程保姆级教程",
        "url": "https://blog.csdn.net/Coder_ljw/article/details/131418579",
        "provider": "CSDN",
        "kind": "article",
        "level": "intermediate",
        "phase": "进阶拓展",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["面向对象"],
        "keywords": ["类", "对象", "继承", "封装"],
        "summary": "适合面向对象概念模糊、需要多看几篇不同解释的人。",
    },
    {
        "id": "csdn-oop-advanced",
        "title": "CSDN：Python3 面向对象全面学习教程",
        "url": "https://blog.csdn.net/weixin_43151418/article/details/150068583",
        "provider": "CSDN",
        "kind": "article",
        "level": "intermediate",
        "phase": "进阶拓展",
        "focus_tags": ["讲解", "复习"],
        "topic_tags": ["面向对象"],
        "keywords": ["类", "对象", "继承", "多态", "封装", "self"],
        "summary": "适合想从类和对象一路看到继承、多态、实际案例的人。",
    },
    {
        "id": "csdn-csv-search",
        "title": "CSDN：Python CSV 文件读取、处理与写入",
        "url": "https://blog.csdn.net/weixin_46124984/article/details/124655560",
        "provider": "CSDN",
        "kind": "article",
        "level": "beginner",
        "phase": "项目实战",
        "focus_tags": ["讲解", "练习"],
        "topic_tags": ["文件处理", "数据处理"],
        "keywords": ["csv", "表格", "数据", "读写"],
        "summary": "适合成绩单、日志、统计表等真实练习场景。",
    },
]


PYTHON_ONLINE_RESOURCES.extend(
    [
        {
            "id": "liaoxuefeng-python-course",
            "title": "廖雪峰 Python 教程",
            "url": "https://www.liaoxuefeng.com/wiki/1016959663602400",
            "provider": "廖雪峰",
            "kind": "article",
            "level": "beginner",
            "phase": "入门启动",
            "focus_tags": ["讲解", "复习"],
            "topic_tags": ["基础语法", "函数参数", "面向对象"],
            "keywords": ["python", "中文教程", "基础", "函数", "面向对象", "模块"],
            "summary": "中文系统教程，适合零基础先把 Python 基础语法、函数、模块和面向对象按顺序过一遍。",
        },
        {
            "id": "runoob-python3-tutorial",
            "title": "菜鸟教程 Python3 基础教程",
            "url": "https://www.runoob.com/python3/python3-tutorial.html",
            "provider": "菜鸟教程",
            "kind": "article",
            "level": "beginner",
            "phase": "入门启动",
            "focus_tags": ["讲解", "复习"],
            "topic_tags": ["基础语法", "分支循环", "函数参数"],
            "keywords": ["python3", "基础语法", "变量", "条件", "循环", "函数"],
            "summary": "适合快速查基础语法和常见写法，页面短，适合作为入门阶段的速查资料。",
        },
        {
            "id": "pynative-basic-exercises",
            "title": "PYnative：Python 基础练习题",
            "url": "https://pynative.com/python-basic-exercise-for-beginners/",
            "provider": "PYnative",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["练习", "复习"],
            "topic_tags": ["基础语法", "输入输出", "字符串格式化"],
            "keywords": ["exercise", "beginner", "基础练习", "print", "input", "字符串"],
            "summary": "按题目训练 Python 基础语法，适合在看完基础概念后立刻做题巩固。",
        },
        {
            "id": "pynative-loop-exercises",
            "title": "PYnative：if / for / while 循环练习",
            "url": "https://pynative.com/python-if-else-and-for-loop-exercise-with-solutions/",
            "provider": "PYnative",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["练习"],
            "topic_tags": ["分支循环"],
            "keywords": ["if", "else", "for", "while", "range", "循环练习"],
            "summary": "专门练条件判断和循环，适合解决能看懂语法但写不出循环逻辑的问题。",
        },
        {
            "id": "pynative-functions-exercises",
            "title": "PYnative：Python 函数练习",
            "url": "https://pynative.com/python-functions-exercise-with-solutions/",
            "provider": "PYnative",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["练习"],
            "topic_tags": ["函数参数"],
            "keywords": ["function", "def", "return", "参数", "函数练习"],
            "summary": "集中训练函数定义、参数、返回值和拆分逻辑，适合补函数使用不熟的问题。",
        },
        {
            "id": "pynative-list-exercises",
            "title": "PYnative：Python 列表练习",
            "url": "https://pynative.com/python-list-exercise-with-solutions/",
            "provider": "PYnative",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["练习"],
            "topic_tags": ["列表方法", "列表字典"],
            "keywords": ["list", "append", "sort", "列表", "列表练习"],
            "summary": "适合练列表增删改查、遍历、排序和基本数据整理。",
        },
        {
            "id": "pynative-dict-exercises",
            "title": "PYnative：Python 字典练习",
            "url": "https://pynative.com/python-dictionary-exercise-with-solutions/",
            "provider": "PYnative",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["练习"],
            "topic_tags": ["字典操作", "数据处理"],
            "keywords": ["dict", "dictionary", "items", "get", "字典练习"],
            "summary": "适合补字典取值、更新、遍历和嵌套字典处理。",
        },
        {
            "id": "pynative-file-exercises",
            "title": "PYnative：Python 文件处理练习",
            "url": "https://pynative.com/python-file-handling-exercise/",
            "provider": "PYnative",
            "kind": "article",
            "level": "beginner",
            "phase": "项目实战",
            "focus_tags": ["练习"],
            "topic_tags": ["文件读写", "文件读取"],
            "keywords": ["file", "open", "read", "write", "文件练习"],
            "summary": "适合练 open、read、write、逐行读取和文件内容处理。",
        },
        {
            "id": "pynative-oop-exercises",
            "title": "PYnative：Python 面向对象练习",
            "url": "https://pynative.com/python-object-oriented-programming-oop-exercise/",
            "provider": "PYnative",
            "kind": "article",
            "level": "intermediate",
            "phase": "进阶拓展",
            "focus_tags": ["练习"],
            "topic_tags": ["面向对象"],
            "keywords": ["oop", "class", "object", "__init__", "继承"],
            "summary": "适合在学完 class 后做题，训练类、对象、方法和继承。",
        },
        {
            "id": "pynative-pandas-exercises",
            "title": "PYnative：pandas 练习题",
            "url": "https://pynative.com/python-pandas-exercise/",
            "provider": "PYnative",
            "kind": "article",
            "level": "intermediate",
            "phase": "项目实战",
            "focus_tags": ["练习"],
            "topic_tags": ["DataFrame基础", "Pandas读取写入", "数据处理"],
            "keywords": ["pandas", "dataframe", "read_csv", "groupby", "练习"],
            "summary": "适合练 pandas 常见操作，尤其是读取、筛选、分组和统计。",
        },
        {
            "id": "realpython-conditionals",
            "title": "Real Python：Conditional Statements",
            "url": "https://realpython.com/python-conditional-statements/",
            "provider": "Real Python",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["讲解"],
            "topic_tags": ["分支循环"],
            "keywords": ["if", "elif", "else", "condition", "条件判断"],
            "summary": "用较完整的英文示例讲条件判断，适合想把 if/elif/else 理清楚的学生。",
        },
        {
            "id": "realpython-for-loop",
            "title": "Real Python：Python for Loops",
            "url": "https://realpython.com/python-for-loop/",
            "provider": "Real Python",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["讲解"],
            "topic_tags": ["分支循环", "循环技巧"],
            "keywords": ["for", "loop", "range", "enumerate", "zip"],
            "summary": "适合补 for 循环、遍历容器、range 和循环技巧。",
        },
        {
            "id": "realpython-functions",
            "title": "Real Python：Defining Your Own Python Function",
            "url": "https://realpython.com/defining-your-own-python-function/",
            "provider": "Real Python",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["讲解"],
            "topic_tags": ["函数参数"],
            "keywords": ["def", "function", "return", "arguments", "parameters"],
            "summary": "适合系统补函数定义、参数传递、返回值和函数拆分思路。",
        },
        {
            "id": "realpython-lists-tuples",
            "title": "Real Python：Lists and Tuples",
            "url": "https://realpython.com/python-lists-tuples/",
            "provider": "Real Python",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["讲解"],
            "topic_tags": ["列表方法", "列表字典"],
            "keywords": ["list", "tuple", "列表", "元组"],
            "summary": "适合理解列表和元组的区别、索引、切片和常见操作。",
        },
        {
            "id": "realpython-dicts",
            "title": "Real Python：Dictionaries",
            "url": "https://realpython.com/python-dicts/",
            "provider": "Real Python",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["讲解"],
            "topic_tags": ["字典操作"],
            "keywords": ["dict", "dictionary", "keys", "values", "items"],
            "summary": "适合系统补字典键值、遍历、查找和嵌套结构。",
        },
        {
            "id": "realpython-files",
            "title": "Real Python：Reading and Writing Files",
            "url": "https://realpython.com/read-write-files-python/",
            "provider": "Real Python",
            "kind": "article",
            "level": "beginner",
            "phase": "项目实战",
            "focus_tags": ["讲解", "练习"],
            "topic_tags": ["文件读写", "文件读取"],
            "keywords": ["file", "open", "with", "read", "write"],
            "summary": "适合把文件打开、读取、写入、上下文管理器这些内容一次讲清楚。",
        },
        {
            "id": "realpython-exceptions",
            "title": "Real Python：Python Exceptions",
            "url": "https://realpython.com/python-exceptions/",
            "provider": "Real Python",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["讲解"],
            "topic_tags": ["异常处理", "调试"],
            "keywords": ["try", "except", "raise", "exception", "错误"],
            "summary": "适合补 try/except、异常类型和错误处理思路。",
        },
        {
            "id": "realpython-oop",
            "title": "Real Python：Object-Oriented Programming",
            "url": "https://realpython.com/python3-object-oriented-programming/",
            "provider": "Real Python",
            "kind": "article",
            "level": "intermediate",
            "phase": "进阶拓展",
            "focus_tags": ["讲解"],
            "topic_tags": ["面向对象"],
            "keywords": ["oop", "class", "object", "__init__", "inheritance"],
            "summary": "适合从例子理解类、对象、属性、方法和继承。",
        },
        {
            "id": "realpython-pandas-dataset",
            "title": "Real Python：pandas DataFrame 入门",
            "url": "https://realpython.com/pandas-python-explore-dataset/",
            "provider": "Real Python",
            "kind": "article",
            "level": "intermediate",
            "phase": "项目实战",
            "focus_tags": ["讲解", "练习"],
            "topic_tags": ["DataFrame基础", "数据处理"],
            "keywords": ["pandas", "dataframe", "dataset", "loc", "groupby"],
            "summary": "适合通过真实数据集学习 pandas DataFrame、筛选和统计。",
        },
        {
            "id": "automate-files",
            "title": "Automate the Boring Stuff：Reading and Writing Files",
            "url": "https://automatetheboringstuff.com/2e/chapter9/",
            "provider": "Automate the Boring Stuff",
            "kind": "article",
            "level": "beginner",
            "phase": "项目实战",
            "focus_tags": ["讲解", "练习"],
            "topic_tags": ["文件读写", "路径处理"],
            "keywords": ["files", "path", "read", "write", "shelve"],
            "summary": "面向自动化脚本的文件读写章节，适合从小任务理解文件和路径。",
        },
        {
            "id": "automate-organizing-files",
            "title": "Automate the Boring Stuff：Organizing Files",
            "url": "https://automatetheboringstuff.com/2e/chapter10/",
            "provider": "Automate the Boring Stuff",
            "kind": "article",
            "level": "intermediate",
            "phase": "项目实战",
            "focus_tags": ["项目", "练习"],
            "topic_tags": ["文件读写", "路径处理", "项目实战"],
            "keywords": ["shutil", "path", "folder", "rename", "organize"],
            "summary": "适合练文件整理、批量移动、复制、重命名，能直接转成小项目。",
        },
        {
            "id": "py4e-files",
            "title": "Python for Everybody：Files",
            "url": "https://www.py4e.com/html3/07-files",
            "provider": "Python for Everybody",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["讲解", "练习"],
            "topic_tags": ["文件读写", "文件读取"],
            "keywords": ["files", "read", "line", "open"],
            "summary": "适合用简单案例理解逐行读取文本文件和基本文本处理。",
        },
        {
            "id": "py4e-lists",
            "title": "Python for Everybody：Lists",
            "url": "https://www.py4e.com/html3/08-lists",
            "provider": "Python for Everybody",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["讲解", "练习"],
            "topic_tags": ["列表方法"],
            "keywords": ["list", "split", "append", "列表"],
            "summary": "适合把列表和文本切分结合起来练，常用于文件读取后的数据整理。",
        },
        {
            "id": "py4e-dictionaries",
            "title": "Python for Everybody：Dictionaries",
            "url": "https://www.py4e.com/html3/09-dictionaries",
            "provider": "Python for Everybody",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["讲解", "练习"],
            "topic_tags": ["字典操作", "数据处理"],
            "keywords": ["dictionary", "count", "histogram", "字典"],
            "summary": "适合练用字典计数、统计词频、处理结构化数据。",
        },
        {
            "id": "kaggle-python",
            "title": "Kaggle Learn：Python",
            "url": "https://www.kaggle.com/learn/python",
            "provider": "Kaggle",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["练习"],
            "topic_tags": ["基础语法", "函数参数", "列表方法"],
            "keywords": ["kaggle", "python", "exercise", "functions", "lists"],
            "summary": "带在线练习的 Python 入门课程，适合想边学边写代码的人。",
        },
        {
            "id": "kaggle-pandas",
            "title": "Kaggle Learn：Pandas",
            "url": "https://www.kaggle.com/learn/pandas",
            "provider": "Kaggle",
            "kind": "article",
            "level": "intermediate",
            "phase": "项目实战",
            "focus_tags": ["练习"],
            "topic_tags": ["Pandas读取写入", "DataFrame基础", "数据处理"],
            "keywords": ["pandas", "dataframe", "read_csv", "indexing", "groupby"],
            "summary": "适合数据处理方向，按 notebook 练 pandas 读取、筛选、分组和统计。",
        },
        {
            "id": "exercism-python",
            "title": "Exercism：Python Track",
            "url": "https://exercism.org/tracks/python/exercises",
            "provider": "Exercism",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["练习"],
            "topic_tags": ["基础语法", "函数参数", "字符串格式化", "列表方法"],
            "keywords": ["exercise", "python", "strings", "lists", "functions"],
            "summary": "题目质量高，适合用小题持续练函数、字符串、列表和简单算法。",
        },
        {
            "id": "w3resource-python-exercises",
            "title": "w3resource：Python Exercises",
            "url": "https://www.w3resource.com/python-exercises/",
            "provider": "w3resource",
            "kind": "article",
            "level": "beginner",
            "phase": "基础巩固",
            "focus_tags": ["练习"],
            "topic_tags": ["基础语法", "列表方法", "字典操作", "函数参数"],
            "keywords": ["exercise", "list", "dictionary", "function", "string"],
            "summary": "题量很大，适合按知识点挑题刷，尤其适合补基础语法熟练度。",
        },
        {
            "id": "project-based-python",
            "title": "Project Based Learning：Python Projects",
            "url": "https://github.com/practical-tutorials/project-based-learning#python",
            "provider": "GitHub",
            "kind": "repository",
            "level": "intermediate",
            "phase": "项目实战",
            "focus_tags": ["项目", "练习"],
            "topic_tags": ["项目实战", "文件读写", "数据处理"],
            "keywords": ["project", "python", "实战", "项目", "tutorial"],
            "summary": "Python 项目集合，适合从语法练习过渡到完整项目实现。",
        },
    ]
)


DEFAULT_COVERAGE_IDS = [
    "liaoxuefeng-python-course",
    "pynative-basic-exercises",
    "pynative-loop-exercises",
    "pynative-functions-exercises",
    "pynative-file-exercises",
    "realpython-files",
    "kaggle-python",
    "kaggle-pandas",
    "exercism-python",
    "project-based-python",
    "official-tutorial",
    "python-100-days",
    "bilibili-full-course",
    "official-input-output",
    "official-pathlib",
    "csdn-file-io",
    "thealgorithms-python",
    "pcc-2e",
    "python-data-science-handbook",
    "pandas-cookbook",
    "bilibili-pandas-search",
    "practical-python",
]


HIGH_VALUE_RESOURCE_IDS = {
    "liaoxuefeng-python-course",
    "runoob-python3-tutorial",
    "pynative-basic-exercises",
    "pynative-loop-exercises",
    "pynative-functions-exercises",
    "pynative-list-exercises",
    "pynative-dict-exercises",
    "pynative-file-exercises",
    "pynative-oop-exercises",
    "pynative-pandas-exercises",
    "realpython-conditionals",
    "realpython-for-loop",
    "realpython-functions",
    "realpython-lists-tuples",
    "realpython-dicts",
    "realpython-files",
    "realpython-exceptions",
    "realpython-oop",
    "realpython-pandas-dataset",
    "automate-files",
    "automate-organizing-files",
    "py4e-files",
    "py4e-lists",
    "py4e-dictionaries",
    "kaggle-python",
    "kaggle-pandas",
    "exercism-python",
    "w3resource-python-exercises",
    "project-based-python",
}


TAG_CATALOG: dict[str, list[str]] = {
    "weakness_tags": [
        "基础语法",
        "分支循环",
        "函数参数",
        "列表方法",
        "列表推导式",
        "字典操作",
        "循环技巧",
        "字符串格式化",
        "文件读写",
        "文件读取",
        "路径处理",
        "异常处理",
        "CSV处理",
        "CSV读写",
        "DictReader/DictWriter",
        "JSON处理",
        "json.load/json.dump",
        "数据处理",
        "Pandas读取写入",
        "DataFrame基础",
        "算法",
        "查找排序",
        "数据结构",
        "面向对象",
        "项目实战",
    ],
    "format_tags": ["讲解型", "练习型", "项目型", "查漏型", "速查型"],
    "level_tags": ["beginner", "intermediate"],
}


TAG_RULES = [
    {
        "tag": "基础语法",
        "signals": ["基础", "语法", "入门", "新手", "python基础"],
        "resource_ids": ["official-tutorial", "bilibili-basic-course", "csdn-foundation-search"],
    },
    {
        "tag": "分支循环",
        "signals": ["if", "elif", "else", "for", "while", "range", "循环", "分支"],
        "resource_ids": ["official-control-flow", "official-if-for-range"],
    },
    {
        "tag": "函数参数",
        "signals": ["def", "return", "参数", "默认参数", "关键字参数", "位置参数", "函数"],
        "resource_ids": ["official-functions-params", "official-control-flow"],
    },
    {
        "tag": "列表方法",
        "signals": ["append", "extend", "insert", "remove", "pop", "sort", "reverse", "列表方法"],
        "resource_ids": ["official-list-methods", "official-data-structures"],
    },
    {
        "tag": "列表推导式",
        "signals": ["列表推导式", "comprehension", "推导式"],
        "resource_ids": ["official-list-comprehension"],
    },
    {
        "tag": "字典操作",
        "signals": ["dict", "字典", "keys", "values", "items", "get", "update"],
        "resource_ids": ["official-dict-basics", "official-data-structures"],
    },
    {
        "tag": "循环技巧",
        "signals": ["enumerate", "zip", "items", "遍历", "索引", "循环技巧"],
        "resource_ids": ["official-looping-techniques", "official-dict-basics"],
    },
    {
        "tag": "字符串格式化",
        "signals": ["f-string", "format", "格式化", "字符串输出", "print"],
        "resource_ids": ["official-strings-format", "official-input-output"],
    },
    {
        "tag": "文件读写",
        "signals": ["文件", "读写", "读取", "写入", "open", "with", "txt"],
        "resource_ids": [
            "official-input-output",
            "official-open",
            "official-file-read-write",
            "csdn-file-io",
            "csdn-open-with",
            "bilibili-file-search",
        ],
    },
    {
        "tag": "文件读取",
        "signals": ["read", "readline", "readlines", "write", "文件读取", "文件写入"],
        "resource_ids": ["official-file-read-write", "official-open"],
    },
    {
        "tag": "路径处理",
        "signals": ["path", "pathlib", "路径", "exists", "glob", "read_text", "write_text"],
        "resource_ids": ["official-pathlib", "official-pathlib-ops"],
    },
    {
        "tag": "异常处理",
        "signals": ["try", "except", "finally", "raise", "异常", "报错"],
        "resource_ids": ["official-errors", "official-try-except"],
    },
    {
        "tag": "CSV处理",
        "signals": ["csv", "表格", "成绩单", "逗号分隔", "excel"],
        "resource_ids": [
            "official-csv",
            "official-csv-reader-writer",
            "official-csv-dict",
            "csdn-csv-search",
            "csdn-pandas-io",
            "pandas-cookbook",
        ],
    },
    {
        "tag": "CSV读写",
        "signals": ["csv.reader", "csv.writer", "reader", "writer", "csv读写"],
        "resource_ids": ["official-csv-reader-writer", "official-csv"],
    },
    {
        "tag": "DictReader/DictWriter",
        "signals": ["dictreader", "dictwriter", "表头", "字段名", "字段", "列名"],
        "resource_ids": ["official-csv-dict"],
    },
    {
        "tag": "JSON处理",
        "signals": ["json", "接口", "结构化数据", "字典数据", "序列化"],
        "resource_ids": ["official-json", "bilibili-json-direct", "official-json-load-dump"],
    },
    {
        "tag": "json.load/json.dump",
        "signals": ["json.load", "json.dump", "loads", "dumps"],
        "resource_ids": ["official-json-load-dump", "official-json"],
    },
    {
        "tag": "数据处理",
        "signals": ["数据", "清洗", "分析", "统计", "处理数据", "数据处理"],
        "resource_ids": [
            "python-data-science-handbook",
            "csdn-pandas-intro",
            "csdn-pandas-io",
            "bilibili-pandas-search",
            "bilibili-pandas-ant",
        ],
    },
    {
        "tag": "Pandas读取写入",
        "signals": ["pandas", "read_csv", "to_csv", "read_excel", "dataframe读取", "读取写入"],
        "resource_ids": ["csdn-pandas-io", "pandas-cookbook", "bilibili-pandas-ant"],
    },
    {
        "tag": "DataFrame基础",
        "signals": ["dataframe", "loc", "iloc", "筛选", "分组", "groupby", "merge"],
        "resource_ids": ["pandas-exercises", "python-data-science-handbook", "bilibili-pandas-search"],
    },
    {
        "tag": "算法",
        "signals": ["算法", "刷题", "二分", "递归", "算法题"],
        "resource_ids": ["thealgorithms-python", "pegasuswang-algo", "bilibili-algo-search", "bilibili-algo-plain"],
    },
    {
        "tag": "查找排序",
        "signals": ["查找", "排序", "二分查找", "冒泡", "快排", "归并"],
        "resource_ids": ["thealgorithms-python", "bilibili-algo-search"],
    },
    {
        "tag": "数据结构",
        "signals": ["栈", "队列", "链表", "树", "图", "哈希", "数据结构"],
        "resource_ids": ["pegasuswang-algo", "bilibili-algo-plain", "thealgorithms-python"],
    },
    {
        "tag": "面向对象",
        "signals": ["类", "对象", "继承", "封装", "多态", "__init__", "面向对象"],
        "resource_ids": ["official-classes", "csdn-oop-search", "csdn-oop-advanced", "bilibili-oop-direct"],
    },
    {
        "tag": "项目实战",
        "signals": ["项目", "实战", "案例", "综合", "完整程序", "小项目"],
        "resource_ids": ["pcc-2e", "python-100-days", "practical-python"],
    },
]


STRICT_TAGS = {
    "文件读写",
    "文件读取",
    "路径处理",
    "CSV处理",
    "CSV读写",
    "DictReader/DictWriter",
    "JSON处理",
    "json.load/json.dump",
    "数据处理",
    "Pandas读取写入",
    "DataFrame基础",
}


KIND_TO_FORMAT_TAGS = {
    "documentation": ["讲解型", "速查型"],
    "article": ["讲解型", "速查型"],
    "video": ["讲解型"],
    "repository": ["练习型", "项目型"],
}


FOCUS_TO_FORMAT_TAG = {
    "讲解": "讲解型",
    "练习": "练习型",
    "复习": "查漏型",
}


FORMAT_SIGNAL_RULES = [
    {"tag": "讲解型", "signals": ["讲解", "视频", "课程", "教程", "说明"]},
    {"tag": "练习型", "signals": ["练习", "代码", "题", "示例", "动手", "刷题"]},
    {"tag": "项目型", "signals": ["项目", "实战", "案例", "完整程序"]},
    {"tag": "查漏型", "signals": ["复习", "巩固", "查漏", "易错", "总结"]},
    {"tag": "速查型", "signals": ["速查", "查文档", "参数", "方法", "小节"]},
]


CLEAN_WEAKNESS_TAGS = [
    "基础语法",
    "分支循环",
    "函数参数",
    "列表方法",
    "列表推导式",
    "字典操作",
    "循环技巧",
    "字符串格式化",
    "文件读写",
    "文件读取",
    "路径处理",
    "异常处理",
    "CSV处理",
    "CSV读写",
    "DictReader/DictWriter",
    "JSON处理",
    "json.load/json.dump",
    "数据处理",
    "Pandas读取写入",
    "DataFrame基础",
    "算法",
    "查找排序",
    "数据结构",
    "面向对象",
    "项目实战",
]

CLEAN_FORMAT_TAGS = ["讲解型", "练习型", "项目型", "查漏型", "速查型"]

for _tag in CLEAN_WEAKNESS_TAGS:
    if _tag not in TAG_CATALOG["weakness_tags"]:
        TAG_CATALOG["weakness_tags"].append(_tag)

for _tag in CLEAN_FORMAT_TAGS:
    if _tag not in TAG_CATALOG["format_tags"]:
        TAG_CATALOG["format_tags"].append(_tag)

KIND_TO_FORMAT_TAGS.update(
    {
        "documentation": ["讲解型", "速查型"],
        "article": ["讲解型", "练习型", "速查型"],
        "video": ["讲解型"],
        "repository": ["练习型", "项目型"],
    }
)

FOCUS_TO_FORMAT_TAG.update({"讲解": "讲解型", "练习": "练习型", "复习": "查漏型", "项目": "项目型"})

FORMAT_SIGNAL_RULES.extend(
    [
        {"tag": "讲解型", "signals": ["讲解", "视频", "课程", "教程", "说明", "概念"]},
        {"tag": "练习型", "signals": ["练习", "代码", "题", "示例", "动手", "刷题"]},
        {"tag": "项目型", "signals": ["项目", "实战", "案例", "完整程序"]},
        {"tag": "查漏型", "signals": ["复习", "巩固", "查漏", "易错", "总结"]},
        {"tag": "速查型", "signals": ["速查", "查文档", "参数", "方法", "小节"]},
    ]
)

STRICT_TAGS.update(
    {
        "文件读写",
        "文件读取",
        "路径处理",
        "CSV处理",
        "CSV读写",
        "DictReader/DictWriter",
        "JSON处理",
        "json.load/json.dump",
        "数据处理",
        "Pandas读取写入",
        "DataFrame基础",
    }
)

TAG_RULES.extend(
    [
        {
            "tag": "基础语法",
            "signals": ["基础", "语法", "入门", "新手", "python基础"],
            "resource_ids": ["liaoxuefeng-python-course", "runoob-python3-tutorial", "pynative-basic-exercises", "kaggle-python", "exercism-python"],
        },
        {
            "tag": "分支循环",
            "signals": ["if", "elif", "else", "for", "while", "range", "循环", "分支"],
            "resource_ids": ["pynative-loop-exercises", "realpython-conditionals", "realpython-for-loop"],
        },
        {
            "tag": "函数参数",
            "signals": ["def", "return", "参数", "默认参数", "关键字参数", "位置参数", "函数"],
            "resource_ids": ["pynative-functions-exercises", "realpython-functions", "kaggle-python"],
        },
        {
            "tag": "列表方法",
            "signals": ["append", "extend", "insert", "remove", "pop", "sort", "reverse", "列表"],
            "resource_ids": ["pynative-list-exercises", "realpython-lists-tuples", "py4e-lists", "w3resource-python-exercises"],
        },
        {
            "tag": "字典操作",
            "signals": ["dict", "字典", "keys", "values", "items", "get", "update"],
            "resource_ids": ["pynative-dict-exercises", "realpython-dicts", "py4e-dictionaries"],
        },
        {
            "tag": "文件读写",
            "signals": ["文件", "读写", "读取", "写入", "open", "with", "txt"],
            "resource_ids": ["pynative-file-exercises", "realpython-files", "automate-files", "py4e-files", "automate-organizing-files"],
        },
        {
            "tag": "文件读取",
            "signals": ["read", "readline", "readlines", "write", "文件读取", "文件写入"],
            "resource_ids": ["pynative-file-exercises", "realpython-files", "py4e-files"],
        },
        {
            "tag": "路径处理",
            "signals": ["path", "pathlib", "路径", "exists", "glob", "目录"],
            "resource_ids": ["automate-files", "automate-organizing-files"],
        },
        {
            "tag": "异常处理",
            "signals": ["try", "except", "finally", "raise", "异常", "报错", "错误"],
            "resource_ids": ["realpython-exceptions"],
        },
        {
            "tag": "CSV处理",
            "signals": ["csv", "表格", "成绩单", "逗号分隔", "excel"],
            "resource_ids": ["automate-files", "kaggle-pandas", "pynative-pandas-exercises"],
        },
        {
            "tag": "数据处理",
            "signals": ["数据", "清洗", "分析", "统计", "处理数据", "数据处理"],
            "resource_ids": ["kaggle-pandas", "pynative-pandas-exercises", "realpython-pandas-dataset", "pynative-dict-exercises"],
        },
        {
            "tag": "Pandas读取写入",
            "signals": ["pandas", "read_csv", "to_csv", "read_excel", "dataframe读取", "读取写入"],
            "resource_ids": ["kaggle-pandas", "pynative-pandas-exercises", "realpython-pandas-dataset"],
        },
        {
            "tag": "DataFrame基础",
            "signals": ["dataframe", "loc", "iloc", "筛选", "分组", "groupby", "merge"],
            "resource_ids": ["kaggle-pandas", "pynative-pandas-exercises", "realpython-pandas-dataset"],
        },
        {
            "tag": "面向对象",
            "signals": ["类", "对象", "继承", "封装", "多态", "__init__", "面向对象", "class"],
            "resource_ids": ["pynative-oop-exercises", "realpython-oop", "liaoxuefeng-python-course"],
        },
        {
            "tag": "项目实战",
            "signals": ["项目", "实战", "案例", "综合", "完整程序", "小项目"],
            "resource_ids": ["project-based-python", "automate-organizing-files", "kaggle-python", "kaggle-pandas"],
        },
    ]
)


def _dedupe_keep_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        if not item or item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def _normalize_text_parts(parts: list[Any]) -> str:
    return " ".join(str(part) for part in parts if str(part).strip()).lower()


def _resource_text(resource: dict[str, Any]) -> str:
    return _normalize_text_parts(
        [
            resource.get("id", ""),
            resource.get("title", ""),
            resource.get("summary", ""),
            " ".join(resource.get("topic_tags", [])),
            " ".join(resource.get("keywords", [])),
        ]
    )


def _match_tag_scores(text: str) -> list[tuple[int, str]]:
    scored: list[tuple[int, str]] = []
    for rule in TAG_RULES:
        hits = sum(1 for signal in rule["signals"] if signal.lower() in text)
        if hits > 0:
            scored.append((hits, rule["tag"]))
    scored.sort(key=lambda item: (item[0], len(item[1])), reverse=True)
    return scored


def _normalize_tag_list(values: list[str], catalog_key: str) -> list[str]:
    allowed = set(TAG_CATALOG[catalog_key])
    return [item for item in _dedupe_keep_order(values) if item in allowed]


def _infer_resource_knowledge_tags(resource: dict[str, Any]) -> list[str]:
    text = _resource_text(resource)
    matched = [tag for _, tag in _match_tag_scores(text)]
    for rule in TAG_RULES:
        if resource["id"] in rule["resource_ids"]:
            matched.append(rule["tag"])
    return _normalize_tag_list(matched, "weakness_tags")[:8]


def _infer_resource_format_tags(resource: dict[str, Any]) -> list[str]:
    tags = list(KIND_TO_FORMAT_TAGS.get(resource.get("kind", ""), []))
    for focus_tag in resource.get("focus_tags", []):
        mapped = FOCUS_TO_FORMAT_TAG.get(focus_tag)
        if mapped:
            tags.append(mapped)
    if "项目实战" in resource.get("topic_tags", []):
        tags.append("项目型")
    return _normalize_tag_list(tags, "format_tags")


def _infer_resource_level_tag(resource: dict[str, Any]) -> str:
    level = str(resource.get("level", "beginner")).strip().lower()
    return level if level in TAG_CATALOG["level_tags"] else "beginner"


def _apply_resource_tags() -> None:
    for resource in PYTHON_ONLINE_RESOURCES:
        resource["knowledge_tags"] = _infer_resource_knowledge_tags(resource)
        resource["format_tags"] = _infer_resource_format_tags(resource)
        resource["level_tag"] = _infer_resource_level_tag(resource)


def _derive_format_tags(text: str, focus: str) -> list[str]:
    tags: list[str] = []
    mapped_focus = FOCUS_TO_FORMAT_TAG.get(focus)
    if mapped_focus:
        tags.append(mapped_focus)
    for rule in FORMAT_SIGNAL_RULES:
        if any(signal.lower() in text for signal in rule["signals"]):
            tags.append(rule["tag"])
    return _normalize_tag_list(tags, "format_tags")


def _derive_level_tag(text: str) -> str:
    advanced_signals = ["进阶", "项目", "实战", "数据分析", "已经会", "有基础"]
    beginner_signals = ["入门", "基础", "不会", "薄弱", "刚开始", "新手"]
    advanced_hits = sum(1 for signal in advanced_signals if signal in text)
    beginner_hits = sum(1 for signal in beginner_signals if signal in text)
    if advanced_hits > beginner_hits:
        return "intermediate"
    return "beginner"


def resolve_profile_recommendation_tags(
    profile: dict[str, Any] | None = None,
    query: str = "",
    focus: str = "讲解",
) -> dict[str, Any]:
    profile = profile or {}
    dimensions = profile.get("dimensions", {})
    text = _normalize_text_parts(
        [
            query,
            profile.get("summary", ""),
            dimensions.get("knowledge", ""),
            dimensions.get("weakness", ""),
            dimensions.get("preference", ""),
            profile.get("next_focus", ""),
        ]
    )

    explicit_weakness_tags = _normalize_tag_list(list(profile.get("weakness_tags", []) or []), "weakness_tags")
    inferred_weakness_tags = [tag for _, tag in _match_tag_scores(text)]
    weakness_tags = explicit_weakness_tags or _normalize_tag_list(inferred_weakness_tags, "weakness_tags")
    if not weakness_tags:
        weakness_tags = ["基础语法"]

    explicit_format_tags = _normalize_tag_list(list(profile.get("preferred_format_tags", []) or []), "format_tags")
    preferred_format_tags = explicit_format_tags or _derive_format_tags(text, focus)
    if not preferred_format_tags:
        preferred_format_tags = [FOCUS_TO_FORMAT_TAG.get(focus, "讲解型")]

    raw_level_tag = str(profile.get("level_tag", "")).strip().lower()
    level_tag = raw_level_tag if raw_level_tag in TAG_CATALOG["level_tags"] else _derive_level_tag(text)

    return {
        "weakness_tags": weakness_tags[:6],
        "preferred_format_tags": preferred_format_tags[:3],
        "level_tag": level_tag,
    }


def _annotate_resource(
    resource: dict[str, Any],
    reasons: list[str],
    match_labels: list[str] | None = None,
) -> dict[str, Any]:
    coverage = f"{resource['phase']} · {' / '.join(resource['topic_tags'])}"
    deduped_reasons = _dedupe_keep_order(reasons)
    reason = "；".join(deduped_reasons[:3]) if deduped_reasons else "适合作为你当前学习阶段的补充资料"
    return {
        **resource,
        "coverage": coverage,
        "recommended_reason": f"{coverage}。{reason}",
        "match_labels": match_labels or [],
    }


def _default_coverage(limit: int) -> list[dict[str, Any]]:
    selected: list[dict[str, Any]] = []
    index = {item["id"]: item for item in PYTHON_ONLINE_RESOURCES}
    for resource_id in DEFAULT_COVERAGE_IDS:
        item = index.get(resource_id)
        if not item:
            continue
        selected.append(_annotate_resource(item, ["适合先搭建一条完整的 Python 学习路径"]))
        if len(selected) >= limit:
            return selected
    return selected


def _score_resource(
    resource: dict[str, Any],
    focus: str,
    query: str,
    selected_tags: list[str],
    preferred_format_tags: list[str],
    level_tag: str,
) -> tuple[int, list[str], list[str]]:
    score = 0
    reasons: list[str] = []
    matched_tags: list[str] = []

    resource_tag_set = set(resource.get("knowledge_tags", []))
    resource_format_set = set(resource.get("format_tags", []))
    resource_topic_set = set(resource.get("topic_tags", []))
    query_text = query.lower()

    topic_tag_matches = [tag for tag in selected_tags if tag in resource_topic_set]
    if topic_tag_matches:
        score += 8 * len(topic_tag_matches)
        matched_tags.extend(topic_tag_matches)
        reasons.append(f"主题正好对应 {topic_tag_matches[0]}")

    direct_tag_matches = [tag for tag in selected_tags if tag in resource_tag_set]
    if direct_tag_matches:
        score += 12 * len(direct_tag_matches)
        matched_tags.extend(direct_tag_matches)
        reasons.append(f"直接补你现在的{direct_tag_matches[0]}")

    keyword_hits = sum(1 for keyword in resource.get("keywords", []) if keyword.lower() in query_text)
    if keyword_hits:
        score += min(keyword_hits * 2, 8)
        if keyword_hits >= 2:
            reasons.append("和你提到的具体知识点更贴近")

    if focus in resource.get("focus_tags", []):
        score += 3
        reasons.append(f"更贴近你现在想要的{focus}方式")

    format_matches = [tag for tag in preferred_format_tags if tag in resource_format_set]
    if format_matches:
        score += 4 * len(format_matches)
        reasons.append(f"形式更适合当前的{format_matches[0]}")

    if level_tag == resource.get("level_tag"):
        score += 2
        reasons.append("难度更适合当前阶段")

    if any(word in query_text for word in ["代码", "练习", "题", "示例", "实战", "可运行", "动手"]):
        if "练习型" in resource_format_set:
            score += 3
        if resource.get("kind") in {"repository", "article"}:
            score += 1

    if any(tag in STRICT_TAGS for tag in direct_tag_matches):
        score += 4

    if resource.get("id") in HIGH_VALUE_RESOURCE_IDS:
        score += 8
        if direct_tag_matches or keyword_hits:
            score += 4
        reasons.append("提供具体章节或练习入口")

    return score, reasons, _dedupe_keep_order(matched_tags)


def recommend_online_resources(
    course_id: str,
    focus: str,
    profile: dict[str, Any] | None = None,
    query: str = "",
    limit: int = 10,
) -> list[dict[str, Any]]:
    if course_id != "python":
        return []

    profile = profile or {}
    tag_payload = resolve_profile_recommendation_tags(profile, query=query, focus=focus)
    selected_tags = tag_payload["weakness_tags"]
    preferred_format_tags = tag_payload["preferred_format_tags"]
    level_tag = tag_payload["level_tag"]
    query_text = _normalize_text_parts(
        [
            focus,
            query,
            profile.get("summary", ""),
            profile.get("dimensions", {}).get("weakness", ""),
            profile.get("next_focus", ""),
            " ".join(selected_tags),
        ]
    )

    if not query.strip() and not str(profile.get("summary", "")).strip() and not selected_tags:
        return _default_coverage(limit)

    primary_tags = selected_tags[:3]
    strict_mode = any(tag in STRICT_TAGS for tag in primary_tags)
    ranked: list[tuple[int, dict[str, Any]]] = []
    for resource in PYTHON_ONLINE_RESOURCES:
        score, reasons, matched_tags = _score_resource(
            resource,
            focus,
            query_text,
            selected_tags,
            preferred_format_tags,
            level_tag,
        )
        ranked.append((score, _annotate_resource(resource, reasons, matched_tags)))

    ranked.sort(
        key=lambda pair: (
            pair[0],
            pair[1]["kind"] in {"repository", "article", "documentation"},
            pair[1]["provider"] == "官方文档",
        ),
        reverse=True,
    )

    selected: list[dict[str, Any]] = []
    selected_ids: set[str] = set()
    if primary_tags and ranked:
        max_score = ranked[0][0]
        strong_cutoff = max(10, max_score - 8)
        for score, item in ranked:
            if len(selected) >= limit:
                break
            if score < strong_cutoff or item["id"] in selected_ids:
                continue
            if strict_mode and not (set(item.get("match_labels", [])) & set(primary_tags)):
                continue
            selected.append(item)
            selected_ids.add(item["id"])

    if strict_mode:
        for score, item in ranked:
            if len(selected) >= min(limit, 6):
                break
            if score <= 0 or item["id"] in selected_ids:
                continue
            if not (set(item.get("match_labels", [])) & set(primary_tags)):
                continue
            selected.append(item)
            selected_ids.add(item["id"])

    for score, item in ranked:
        if len(selected) >= limit:
            break
        if score <= 0 or item["id"] in selected_ids:
            continue
        selected.append(item)
        selected_ids.add(item["id"])

    if not selected:
        return _default_coverage(limit)
    return selected


_apply_resource_tags()
