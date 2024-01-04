layui.define(function (exports) { // 也可以依赖其他模块
    var obj = {
        hello: function (str) {
            layui.layer.alert("Hello " + (str || "firstMod"));
        }
    };

    exports("firstMod", obj);
});