# 项目依赖
- 服务器环境：node
- 项目包管理：npm
- 项目框架：express
- 数据库:文件形数据库NeDB

# 目录文件说明
- config: openKB相关配置
- locales: openKB语言国际化相关
- public: 前端相关样式文件定义
- routes: 后端代码
- views: 前端模板替换页面代码
- app.js: 项目入口文件(在此处修改端口号)
- Profile: Heroku配置文件(可忽略)
- Dockerfile: Docker镜像配置文件
- 其它文件

# 本地运行
```bash
npm install #安装依赖包
npm start  #运行服务
```

# 系统说明
由两部分组成：简单的监控系统展示+简单的后台管理
## 后台管理子系统
主要代码位于：`routes/kb`
本地访问链接：[http://localhost:4444/xg](http://localhost:4444/xg)
使用用户名：`admin@xiaogu-tech.com`;密码：`admin`登录
完成包括组织的管理以及对应组织下的`grafana`监控`panel`链接的管理以及包括对报警的帮助文章的书写和链接管理等
## 监控系统展示
使用由后台添加的组织及六位随机密码登录系统[http://localhost:4444](http://localhost:4444)。
以组织：`xg`;随机六位密码：`RcmWtW`登录系统查看。
可以查看不同分类下的数据监控信息以及自动获取报警推送和查看对应报警的解决方案文章。