layui.define([
    "table",
    "form",
    "laydate",
    "laytpl"
], function (exports) {
    "use strict";

    var $                   = layui.$,
        form                = layui.form,
        laytpl              = layui.laytpl,
        laydate             = layui.laydate,
        MOD_NAME            = "searchForm",

        searchForm          = {
            config: {},
            index : layui[MOD_NAME] ? (layui[MOD_NAME].index + 10000) : 0,
            set   : function (options) {
                var that    = this;
                that.config = $.extend({}, that.config, options);
                return that;
            },
            on    : function (events, callback) {
                return layui.onevent.call(this, MOD_NAME, events, callback);
            }
        },

        thisModule          = function () {
            var that    = this,
                options = that.config,
                id      = options.id || that.index;

            thisModule.that[id]   = that; //记录当前实例对象
            thisModule.config[id] = options; //记录当前实例配置项

            return {
                config    : options, //重置实例
                reload    : function (options) {
                    that.reload.call(that, options);
                },
                getData   : function () {
                    return that.getData.call(that);
                },
                renderForm: function (data) {
                    return that.renderForm.call(that, data);
                }
            };
        },
        getThisModuleConfig = function (id) {
            var config = thisModule.config[id];
            if (!config) hint.error("The ID option was not found in the " + MOD_NAME + " instance");
            return config || null;
        },
        ELEM                = "diy-form",
        NONE                = "diy-form-none",
        TPL_SUB             = `<div class="diy-form-group" style="display: flex;"></div>`,
        TPL_SUB_ITEM        = `<div class="diy-form-item" style="display: flex;"></div>`,

        TPL_SUB_TITLE       = `<div class="diy-form-title" style="margin-bottom: 5px; margin-right: 10px;">
      <select class="form-control" lay-filter="diy-form-title" lay-search="">
        {{#  layui.each(d, function(index, item){ }}
        <option value="{{= item.field }}"> {{= item.title }} </option>
        {{#  }); }}
      </select>
    </div>`,

        TPL_SUB_CONDITION   = `<div class="diy-form-condition" style="margin-bottom: 5px; margin-right: 10px;">
        <select class="form-control" lay-filter="diy-form-condition" lay-search="">
          {{#  layui.each(d, function(index, item){ }}
          <option value="{{= item.key }}"> {{= item.value }} </option>
          {{#  }); }}
        </select>
    </div>`,

        TPL_SUB_VALUE       = `<div class="diy-form-value" style="position: relative; margin-bottom: 5px; margin-right: 10px;">
      {{# if(d.type == 'text'){ }}
      <input type="text" name="{{= d.field }}" placeholder="请输入" autocomplete="off" class="layui-input" style="width: 212px;">
      {{# } }}
      {{# if(d.type == 'select'){ }}
      <select class="form-control" lay-filter="diy-form-value" name="{{= d.field }}" lay-search="">
        {{#  layui.each(d.options, function(index, item){ }}
        <option value="{{= item.value }}"> {{= item.caption }} </option>
        {{#  }); }}
      </select>
      {{# } }}
      {{# if(d.type == 'date'){ }}
      <div class="layui-input-prefix" style="top: 7px;">
        <i class="layui-icon layui-icon-date"></i>
      </div>
      <input type="text" name="{{= d.field }}" id="{{= d.field }}" lay-verify="date" placeholder="{{= d.placeholder }}" autocomplete="off" class="layui-input" style="width: 212px;padding-left: 30px;">
      {{# } }}
      {{# if(d.type == 'date-range'){ }}
        <div id="{{= d.field }}" style="display: flex;">
          <input type="text" autocomplete="off" id="{{= d.field }}-start" class="layui-input" placeholder="{{= d.placeholder }}">
          <div class="diy-form-mid" style="padding: 5px 5px;">-</div>
          <input type="text" autocomplete="off" id="{{= d.field }}-end" class="layui-input" placeholder="{{= d.placeholder }}">
        </div>
      {{# } }}
    </div>`
        ,
        TPL_SUB_AND_OR      = `<div class="diy-form-and-or" style="width: 115px;">
        <select class="form-control" lay-filter="diy-form-and-or">
          <option value="and"> 并且 </option>
          <option value="or"> 或者 </option>
        </select>
      </div>`

        // 删除按钮
        ,
        TPL_DEL_BTN         = `<div class="diy-form-delete" style="
          padding-left: 5px;
          padding-top: 4px;
      "><i class="layui-icon layui-icon-close-fill" style="font-size: 23px; color: #969eaf;"></i></div>`

        // sub按钮
        ,
        TPL_SUB_BTN         = `<button type="button" class="layui-btn layui-btn-normal layui-btn-sm" style="margin-left: 10px;"
      lay-filter="diy-form-sub">
        <i class="layui-icon layui-icon-search"></i> 查询
      </button>`

        // 重置按钮
        ,
        TPL_RESET_BTN       = `<button type="button" class="layui-btn layui-btn-normal layui-btn-sm" lay-filter="diy-form-reset">
        <i class="layui-icon layui-icon-refresh"></i> 重置
      </button>`

        // 添加按钮
        ,
        TPL_ADD_BTN         = `<button type="button" class="layui-btn layui-btn-primary layui-btn-xs diy-form-add" style="background-color: white; 
        color: #1e9fff;border: 1px solid #1e9fff;">
        <i class="layui-icon layui-icon-add-1"></i> 添加条件
      </button>`

        //构造器
        ,
        Class               = function (options) {
            var that    = this;
            that.index  = ++diyForm.index;
            that.config = $.extend({}, that.config, diyForm.config, options);
            that.render();
        };

    //默认配置
    Class.prototype.config = {
        condition            : [
            {
                key  : "eq",
                value: "等于"
            },
            {
                key  : "neq",
                value: "不等于"
            },
            {
                key  : "gt",
                value: "大于"
            },
            {
                key  : "egt",
                value: "大于等于"
            },
            {
                key  : "lt",
                value: "小于"
            },
            {
                key  : "elt",
                value: "小于等于"
            },
            {
                key  : "like",
                value: "包含"
            },
            {
                key  : "notLike",
                value: "不包含"
            },
            {
                key  : "today",
                value: "今天"
            },
            {
                key  : "yesterday",
                value: "昨天"
            },
            {
                key  : "thisweek",
                value: "本周"
            },
            {
                key  : "lastweek",
                value: "上周"
            },
            {
                key  : "thismonth",
                value: "本月"
            },
            {
                key  : "lastmonth",
                value: "上月"
            },
            {
                key  : "last3months",
                value: "过去三个月"
            },
            {
                key  : "between",
                value: "自定义"
            },
            {
                key  : "notBetween",
                value: "不从-到"
            },
            {
                key  : "in",
                value: "属于"
            },
            {
                key  : "notIn",
                value: "不属于"
            },
            {
                key  : "null",
                value: "为空"
            },
            {
                key  : "notNull",
                value: "不为空"
            }
        ],
        singleValueConditions: [
            "eq",
            "neq",
            "gt",
            "egt",
            "lt",
            "elt"
        ],
        doubleValueConditions: [
            "between",
            "notBetween"
        ],
        stringConditions     : [
            "like",
            "notLike"
        ],
        listConditions       : [
            "in",
            "notIn"
        ],
        nullConditions       : [
            "null",
            "notNull"
        ],
        comparisonConditions : [
            "eq",
            "neq"
        ],
        dateConditions       : [
            "today",
            "yesterday",
            "thisweek",
            "lastweek",
            "thismonth",
            "lastmonth",
            "last3months",
            "between"
        ]
    };

    //重载实例
    Class.prototype.reload = function (options) {
        var that    = this;
        that.config = $.extend(true, {}, that.config, options);
        that.render();
        // 重置尺寸
        that.resize(that.config);
    };

    //渲染
    Class.prototype.render = async function () {
        var that    = this,
            options = that.config;

        //解析模板
        var othis = options.elem = $(options.elem);
        if (!othis[0]) return;

        // 获取数据
        await that.pullData();

        // 根据默认数据渲染表单
        if (options.defaultValue && options.defaultValue.length > 0)
        {
            that.renderForm(options.defaultValue);
            that.resize(options);
            return;
        }

        //添加子模板
        const sub = that.createSub(0);
        // 删除del按钮
        // sub.find('.diy-form-item:last .diy-form-delete').remove();

        // // sub按钮
        // const subBtn = that.subBtn = $(TPL_SUB_BTN);
        // // 重置按钮
        // const resetBtn = that.resetBtn = $(TPL_RESET_BTN);

        // // 插入到子模板中最后一个item中
        // sub.find('.diy-form-item:last').append(subBtn).append(resetBtn);

        //索引
        that.key = options.id || that.index;

        //插入组件结构
        othis.html(sub);
        // 添加添加条件按钮
        const addBtn = that.addBtn = $(TPL_ADD_BTN);
        othis.append($(TPL_SUB).append(TPL_SUB_ITEM).append(addBtn));

        form.render();
        // 日期组件
        that.renderDate(options.data[0], sub);

        that.events(); //事件

        // 加载完成回调
        typeof options.done === "function" && options.done(options);
    };

    // 获取数据
    Class.prototype.pullData = function () {
        var that    = this,
            e       = that.elem,
            options = that.config;

        return new Promise((resolve, reject) => {

            if (options.url)
            {
                $.ajax({
                    type         : options.method || "get",
                    url          : options.url,
                    contentType  : options.contentType,
                    data         : options.params,
                    dataType     : options.dataType || "json",
                    jsonpCallback: options.jsonpCallback,
                    headers      : options.headers || {},
                    success      : function (res) {

                        const data = res.data || [];

                        if (data.length == 0)
                        {
                            that.errorView("请求异常，错误提示：" + res.msg || "数据为空");
                            return;
                        }

                        options.data = data;
                        resolve(data);
                    },
                    error        : function (e, msg) {
                        that.errorView("请求异常，错误提示：" + msg || "数据为空");
                    }
                });
            }
            else
            {
                resolve(options.data);
            }
        });

    };

    // 异常提示
    Class.prototype.errorView = function (html) {
        var that    = this,
            layNone = $("<div class=\"" + NONE + "\" style=\" line-height: 26px; padding: 30px 15px; text-align: center; color: #999; \">" + (html || "Error") + "</div>");

        that.config.elem.html(that.layNone = layNone);
    };

    // 生成子模板
    Class.prototype.createSub = function (index, defaultValue = {}) {
        var that           = this,
            e              = that.elem,
            a              = that.config;
        const sub          = $(TPL_SUB);
        const subItem      = $(TPL_SUB_ITEM);
        const subTitle     = $(laytpl(TPL_SUB_TITLE).render(a.data));
        const row          = a.data[index];
        const subCondition = $(laytpl(TPL_SUB_CONDITION).render(that.getCondition(row)));
        const subValue     = $(laytpl(TPL_SUB_VALUE).render(row));
        const subAndOr     = $(TPL_SUB_ITEM).append(TPL_SUB_AND_OR);
        const subDel       = $(TPL_DEL_BTN);
        subItem.append(subTitle);
        subItem.append(subCondition);
        subItem.append(subValue);
        sub.append(subItem);
        subAndOr.append(subDel);
        sub.append(subAndOr);
        // 默认值
        if (defaultValue)
        {
            that.setDefaultValue(sub, defaultValue, row);
        }
        return sub;
    };

    // 获取condition
    Class.prototype.getCondition = function (row) {
        var that = this,
            a    = that.config;

        const type = row.type;

        // 如果row中有condition，则直接返回
        if (row.condition && row.condition.length > 0)
        {
            return row.condition;
        }

        return a.condition.filter(condition => {
            if (type == "number" && a.singleValueConditions.includes(condition.key))
            {
                // 展示单值输入框
                return condition;
            }
            else if (type == "date" && a.dateConditions.includes(condition.key))
            {
                // 展示双值输入框
                return condition;
            }
            else if (type == "text" && a.stringConditions.includes(condition.key))
            {
                // 展示字符串输入框
                return condition;
            }
            else if (type == "select" && a.comparisonConditions.includes(condition.key))
            {
                // 展示列表输入框
                return condition;
            }
            else if (type == "text" && a.nullConditions.includes(condition.key))
            {
                // 展示空值操作符表单元素（可能不需要输入框）
                return condition;
            }
        });
    };

    // 设置默认值
    Class.prototype.setDefaultValue = function (sub, defaultValue, row) {
        const that = this,
              a    = that.config,
              type = row.type;

        sub.find(".diy-form-title select").val(defaultValue.field || "");
        sub.find(".diy-form-condition select").val(defaultValue.condition || "");

        if (type == "date" || type == "date-range")
        {
            // 日期
            // 判断 value 的值 在dateConditions中是否存在
            if (a.dateConditions.includes(defaultValue.value))
            {
                sub.find(".diy-form-condition select").val(defaultValue.value || "");
                sub.find(".diy-form-value input").val("");
            }
            else
            {
                sub.find(".diy-form-value input").val(defaultValue.value || "");
            }
        }
        else if (type == "number" || type == "text")
        {
            // input
            sub.find(".diy-form-value input").val(defaultValue.value || "");
        }
        else if (type == "select")
        {
            // 列表
            sub.find(".diy-form-value select").val(defaultValue.value || "");
        }

        sub.find(".diy-form-and-or select").val(defaultValue.connector || "and");
    };

    // 渲染时间
    Class.prototype.renderDate = function (row, sub) {
        var that = this,
            a    = that.config;

        // 遍历data，渲染日期组件
        const valueDom = $(sub).find(".diy-form-value").find("input,select,textarea");
        let elem       = null;
        // 日期
        if (row.type === "date")
        {
            elem = laydate.render({
                elem       : `#${row.field}`,
                range      : row.range ?? true,
                rangeLinked: true
            });

            const condition = $(sub).find(".diy-form-condition").find("input,select,textarea").val().trim();
            valueDom.removeAttr("disabled");
            if (condition !== "between")
            {
                valueDom.attr("disabled", true);
                valueDom.val("");
            }

        }
        else if (row.type === "date-range")
        { // 日期范围 - 左右面板联动选择模式
            elem = laydate.render({
                elem       : `#${row.field}`, // range: [`#${row.field}-start`, `#${row.field}-end`],
                range      : true,
                rangeLinked: true
            });

            const condition = $(sub).find(".diy-form-condition").find("input,select,textarea").val().trim();
            valueDom.removeAttr("disabled");
            if (condition !== "between")
            {
                valueDom.attr("disabled", true);
                valueDom.val("");
            }
        }

    };

    // 选择字段，重新渲染
    Class.prototype.reloadSub = function (obj, value) {
        var that           = this,
            a              = that.config;
        const subItem      = $(obj).closest(".diy-form-item");
        // 根据value获取data
        const row          = a.data.find(item => item.field === value);
        const condition    = that.getCondition(row);
        const subCondition = $(laytpl(TPL_SUB_CONDITION).render(condition));
        const subValue     = $(laytpl(TPL_SUB_VALUE).render(row));
        // 替换condition
        subItem.find(".diy-form-condition").replaceWith(subCondition);
        // 替换value
        subItem.find(".diy-form-value").replaceWith(subValue);
        return subItem;
    };

    // 获取表单数据
    Class.prototype.getData = function () {
        var that = this,
            e    = that.elem,
            a    = that.config;
        return $(a.elem).find(".diy-form-group").map(function (index, group) {
            const field   = $(group).find(".diy-form-title").find("input,select,textarea").val();
            let condition = $(group).find(".diy-form-condition").find("input,select,textarea").val();
            let value     = $(group).find(".diy-form-value").find("input,select,textarea").val();
            const where   = $(group).find(".diy-form-and-or").find("input,select,textarea").val();
            // 判断 condition 的值 在dateConditions中是否存在
            if (a.dateConditions.includes(condition) && condition !== "between")
            {
                value     = condition;
                condition = "between";
            }
            return field && condition && value ? {
                field,
                condition,
                value,
                where
            } : null;
        }).get();
    };

    // 根据数据渲染表单
    Class.prototype.renderForm = function (data) {
        var that = this,
            e    = that.elem,
            a    = that.config;
        // 清空表单
        a.elem.find(".diy-form-group").remove();
        // 渲染表单
        data.forEach((row, index) => {
            // 获取当前行的数据，在a.data中的索引
            const i   = a.data.findIndex(item => item.field === row.field);
            const sub = that.createSub(i, row);
            if (index == 0)
            {
                // 删除del按钮
                sub.find(".diy-form-item:last .diy-form-delete").remove();

                // // sub按钮
                // const subBtn = that.subBtn = $(TPL_SUB_BTN);
                // // 重置按钮
                // const resetBtn = that.resetBtn = $(TPL_RESET_BTN);

                // // 插入到子模板中最后一个item中
                // sub.find('.diy-form-item:last').append(subBtn).append(resetBtn);

            }

            //插入组件结构
            a.elem.append(sub);

            // 日期组件
            that.renderDate(row, sub);
        });

        // 添加按钮
        const addBtn = that.addBtn = $(TPL_ADD_BTN);
        a.elem.append($(TPL_SUB).append(TPL_SUB_ITEM).append(addBtn));

        form.render();

        that.events(); //事件

        // 重置尺寸
        // that.resize(a);

        // 加载完成回调
        typeof a.done === "function" && a.done(a);
    };

    //事件
    Class.prototype.events = function () {
        var that    = this,
            options = that.config;
        // 更多条件
        form.on("select(diy-form-and-or)", function (data) {
            const group = $(this).closest(".diy-form-group");
            if (data.value && group.nextAll().length === 0)
            {
                const sub = that.createSub(0);
                options.elem.append(sub);
                // 日期组件
                that.renderDate(row, sub);
                form.render();
                // 重置尺寸
                that.resize(options);
            }
            else if (!data.value)
            {
                group.nextAll().remove();
                // 重置尺寸
                that.resize(options);
            }
        });
        // 选择字段
        form.on("select(diy-form-title)", function (data) {
            const group = $(this).closest(".diy-form-group");
            if (data.value)
            {
                that.reloadSub(this, data.value);
                const row = options.data.find(item => item.field === data.value);
                // 日期组件
                that.renderDate(row, group);
                form.render();
            }

        });
        // 选择条件
        form.on("select(diy-form-condition)", function (data) {
            const group = $(this).closest(".diy-form-group");
            const value = group.find(".diy-form-value");
            if (data.value)
            {
                const row = options.data.find(item => item.field === group.find(".diy-form-title").find("input,select,textarea").val().trim());
                // 日期组件
                that.renderDate(row, group);
                form.render();
            }
        });
        // 值的回车
        $(options.elem).on("keydown", ".diy-form-group .diy-form-value input,select,textarea", function (e) {
            if (e.keyCode === 13)
            {
                return false;
            }
        });

        // // sub
        // that.subBtn.on('click', function () {
        //   typeof options.onSearch === 'function' ? options.onSearch(that.getData()) : '';
        // });

        // // resetBtn
        // that.resetBtn.on('click', function () {
        //   that.reload(that.config);
        // });

        // delete
        $(options.elem).on("click", ".diy-form-group .diy-form-delete", function (e) {
            const group = $(this).closest(".diy-form-group");
            // 只剩下一个，不删除
            if ($(options.elem).find(".diy-form-group").length === 1)
            {
                return;
            }
            group.remove();
            // 重置尺寸
            that.resize(options);
        });

        // add
        that.addBtn.on("click", function () {
            const sub         = that.createSub(0);
            // elem 在倒数第二个位置插入
            const groupLength = options.elem.find(".diy-form-group").length == 1 ? 0 : 1;
            options.elem.find(".diy-form-group").eq(`-${groupLength}`).before(sub);

            form.render();
            // 重置尺寸
            that.resize(options);
        });
    };

    // 重置尺寸
    Class.prototype.resize = function () {
        var that = this,
            a    = that.config;
        // 重置尺寸
        a.resize && typeof a.resize === "function" && a.resize(a);
    };

    //记录所有实例
    thisModule.that   = {}; //记录所有实例对象
    thisModule.config = {}; //记录所有实例配置项

    //获取当前实例对象
    thisModule.getThis = function (id) {
        var that = thisModule.that[id];
        if (!that) hint.error(id ? (MOD_NAME + " instance with ID '" + id + "' not found") : "ID argument required");
        return that;
    };

    //重载实例
    diyForm.reload = function (id, options) {
        var that = thisModule.that[id];
        that.reload(options);
        return thisModule.call(that);
    };
    //核心入口
    diyForm.render = function (options) {
        var inst = new Class(options);
        return thisModule.call(inst);
    };

    exports(MOD_NAME, diyForm);
});
